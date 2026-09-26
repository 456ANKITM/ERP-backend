import mongoose from "mongoose";

import Purchase from "@/models/Purchase.model.js";
import Product from "@/models/Product.model.js";
import Supplier from "@/models/Supplier.model.js";
import Store from "@/models/Store.model.js";
import StockMovement from "@/models/StockMovement.model.js";
import { USER_ROLES } from "@/models/User.model.js";

import ApiError from "@/utils/ApiError.js";

import { PURCHASE_MESSAGES, PURCHASE_DEFAULTS } from "./purchases.constants.js";
import { validatePurchaseId, validateListPurchasesQuery } from "./purchases.validator.js";

const buildPagination = ({ page, limit, total }) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toNum = (decimalOrNumber) =>
  decimalOrNumber === null || decimalOrNumber === undefined
    ? 0
    : parseFloat(decimalOrNumber.toString());

const round2 = (n) => Math.round(n * 100) / 100;

const resolveWriteStoreId = async ({ user, bodyStoreId }) => {
  if (user.role === USER_ROLES.STORE_MANAGER) {
    return user.storeId;
  }

  if (!bodyStoreId) {
    throw new ApiError(400, PURCHASE_MESSAGES.STORE_ID_REQUIRED);
  }

  const store = await Store.findOne({
    _id: bodyStoreId,
    businessId: user.businessId,
    deletedAt: null,
    status: Store.STATUS.ACTIVE,
  });

  if (!store) {
    throw new ApiError(404, PURCHASE_MESSAGES.STORE_NOT_FOUND);
  }

  return store;
};

const resolveReadStoreFilter = (user, queryStoreId) => {
  if (user.role === USER_ROLES.STORE_MANAGER) {
    return user.storeId;
  }
  return queryStoreId || null;
};

const findScopedPurchase = async ({ user, purchaseId }) => {
  validatePurchaseId(purchaseId);

  const filter = {
    _id: purchaseId,
    businessId: user.businessId,
  };

  if (user.role === USER_ROLES.STORE_MANAGER) {
    filter.storeId = user.storeId;
  }

  const purchase = await Purchase.findOne(filter);

  if (!purchase) {
    throw new ApiError(404, PURCHASE_MESSAGES.PURCHASE_NOT_FOUND);
  }

  return purchase;
};


const generatePurchaseNumber = async ({ businessId, storeId, storeCode, session }) => {
  for (let attempt = 0; attempt < PURCHASE_DEFAULTS.NUMBER_GENERATION_MAX_ATTEMPTS; attempt += 1) {
    const count = await Purchase.countDocuments({ businessId, storeId }).session(session);
    const sequence = String(count + 1 + attempt).padStart(5, "0");
    const candidate = `PUR-${storeCode}-${sequence}`;

    const exists = await Purchase.findOne({ businessId, storeId, purchaseNumber: candidate }).session(session);

    if (!exists) {
      return candidate;
    }
  }

  throw new ApiError(500, PURCHASE_MESSAGES.NUMBER_GENERATION_FAILED);
};

export const createPurchase = async ({ user, data }) => {
  const store = await resolveWriteStoreId({ user, bodyStoreId: data.storeId });
  const storeId = store._id ?? store; 

  const actualStoreId = user.role === USER_ROLES.STORE_MANAGER ? user.storeId : store._id;

  const supplier = await Supplier.findOne({
    _id: data.supplierId,
    businessId: user.businessId,
    deletedAt: null,
    status: Supplier.STATUS.ACTIVE,
  });

  if (!supplier) {
    throw new ApiError(404, PURCHASE_MESSAGES.SUPPLIER_NOT_FOUND);
  }

  const session = await mongoose.startSession();

  let createdPurchase;

  try {
    await session.withTransaction(async () => {
      const productIds = data.items.map((item) => item.productId);

      const products = await Product.find({
        _id: { $in: productIds },
        businessId: user.businessId,
        storeId: actualStoreId,
        deletedAt: null,
      }).session(session);

      const productMap = new Map(products.map((p) => [String(p._id), p]));

      if (productMap.size !== productIds.length) {
        throw new ApiError(404, PURCHASE_MESSAGES.PRODUCT_NOT_FOUND);
      }

      const lineItems = data.items.map((item) => {
        const product = productMap.get(String(item.productId));
        const costPrice =
          item.costPrice !== undefined ? item.costPrice : toNum(product.costPrice);
        const subtotal = round2(costPrice * item.quantity);

        return {
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          quantity: item.quantity,
          costPrice,
          subtotal,
        };
      });

      const itemsSubtotal = round2(
        lineItems.reduce((sum, item) => sum + item.subtotal, 0),
      );

      const totalAmount = round2(itemsSubtotal - data.discount + data.tax);

      if (totalAmount < 0) {
        throw new ApiError(400, PURCHASE_MESSAGES.DISCOUNT_TOO_HIGH);
      }

      if (data.amountPaid > totalAmount) {
        throw new ApiError(400, PURCHASE_MESSAGES.AMOUNT_EXCEEDS_TOTAL);
      }

      const amountDue = round2(totalAmount - data.amountPaid);

      let paymentStatus = Purchase.PAYMENT_STATUS.UNPAID;
      if (amountDue <= 0) paymentStatus = Purchase.PAYMENT_STATUS.PAID;
      else if (data.amountPaid > 0) paymentStatus = Purchase.PAYMENT_STATUS.PARTIAL;

      const storeCode =
        user.role === USER_ROLES.STORE_MANAGER
          ? (await Store.findById(actualStoreId).session(session).select("code")).code
          : store.code;

      const purchaseNumber =
        data.purchaseNumber ||
        (await generatePurchaseNumber({
          businessId: user.businessId,
          storeId: actualStoreId,
          storeCode,
          session,
        }));

      const [purchase] = await Purchase.create(
        [
          {
            businessId: user.businessId,
            storeId: actualStoreId,
            supplierId: supplier._id,
            purchaseNumber,
            items: lineItems,
            subtotal: itemsSubtotal,
            discount: data.discount,
            tax: data.tax,
            totalAmount,
            amountPaid: data.amountPaid,
            amountDue,
            paymentStatus,
            purchaseDate: data.purchaseDate,
            notes: data.notes ?? null,
            createdBy: user._id,
          },
        ],
        { session },
      );

      // Increment stock and log a movement per line item.
      for (const item of lineItems) {
        const product = productMap.get(String(item.productId));
        const previousQuantity = product.quantityInStock;
        const newQuantity = previousQuantity + item.quantity;

        product.quantityInStock = newQuantity;
        product.updatedBy = user._id;
        await product.save({ session });

        await StockMovement.create(
          [
            {
              businessId: user.businessId,
              storeId: actualStoreId,
              productId: product._id,
              type: StockMovement.TYPES.PURCHASE,
              quantity: item.quantity,
              previousQuantity,
              newQuantity,
              referenceId: purchase._id,
              referenceModel: "Purchase",
              reason: `Purchase ${purchase.purchaseNumber}`,
              createdBy: user._id,
            },
          ],
          { session },
        );
      }

      createdPurchase = purchase;
    });
  } finally {
    await session.endSession();
  }

  return createdPurchase.toObject();
};

export const listPurchases = async ({ user, query }) => {
  const {
    page,
    limit,
    supplierId,
    storeId: queryStoreId,
    paymentStatus,
    status,
    startDate,
    endDate,
    search,
    sortBy,
    sortOrder,
  } = validateListPurchasesQuery(query);

  const storeFilter = resolveReadStoreFilter(user, queryStoreId);

  const skip = (page - 1) * limit;

  const filter = {
    businessId: user.businessId,
    // Cancelled purchases are hidden by default unless explicitly asked for.
    status: status || Purchase.RECORD_STATUS.RECORDED,
  };

  if (storeFilter) filter.storeId = storeFilter;
  if (supplierId) filter.supplierId = supplierId;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  if (startDate || endDate) {
    filter.purchaseDate = {};
    if (startDate) filter.purchaseDate.$gte = startDate;
    if (endDate) filter.purchaseDate.$lte = endDate;
  }

  if (search) {
    filter.purchaseNumber = { $regex: escapeRegex(search), $options: "i" };
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
  sort._id = sortOrder === "asc" ? 1 : -1;

  const [purchases, total] = await Promise.all([
    Purchase.find(filter)
      .populate({ path: "supplierId", select: "name contactPerson phone" })
      .populate({ path: "storeId", select: "name code" })
      .select("-items")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Purchase.countDocuments(filter),
  ]);

  return { purchases, pagination: buildPagination({ page, limit, total }) };
};

export const getPurchaseDetails = async ({ user, purchaseId }) => {
  const purchase = await findScopedPurchase({ user, purchaseId });

  await purchase.populate([
    { path: "supplierId", select: "name contactPerson phone email" },
    { path: "storeId", select: "name code" },
    { path: "createdBy", select: "name email" },
    { path: "items.productId", select: "name sku status quantityInStock" },
  ]);

  return { purchase: purchase.toObject() };
};

export const updatePaymentStatus = async ({ user, purchaseId, data }) => {
  const purchase = await findScopedPurchase({ user, purchaseId });

  if (purchase.status === Purchase.RECORD_STATUS.CANCELLED) {
    throw new ApiError(409, PURCHASE_MESSAGES.CANNOT_MODIFY_CANCELLED);
  }

  const totalAmount = toNum(purchase.totalAmount);

  let amountPaid;
  let amountDue;

  if (data.status === Purchase.PAYMENT_STATUS.PAID) {
    amountPaid = totalAmount;
    amountDue = 0;
  } else if (data.status === Purchase.PAYMENT_STATUS.UNPAID) {
    amountPaid = 0;
    amountDue = totalAmount;
  } else {
    // PARTIAL — validator guarantees amountPaid is present here.
    if (data.amountPaid <= 0 || data.amountPaid >= totalAmount) {
      throw new ApiError(400, PURCHASE_MESSAGES.PARTIAL_AMOUNT_REQUIRED);
    }
    amountPaid = data.amountPaid;
    amountDue = round2(totalAmount - amountPaid);
  }

  purchase.amountPaid = amountPaid;
  purchase.amountDue = amountDue;
  purchase.paymentStatus = data.status;
  purchase.updatedBy = user._id;

  await purchase.save();

  return purchase.toObject();
};

export const cancelPurchase = async ({ user, purchaseId }) => {
  const purchase = await findScopedPurchase({ user, purchaseId });

  if (purchase.status === Purchase.RECORD_STATUS.CANCELLED) {
    throw new ApiError(409, PURCHASE_MESSAGES.ALREADY_CANCELLED);
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const productIds = purchase.items.map((item) => item.productId);

      const products = await Product.find({
        _id: { $in: productIds },
      }).session(session);

      const productMap = new Map(products.map((p) => [String(p._id), p]));

      // Verify every item can be safely reversed before changing anything.
      for (const item of purchase.items) {
        const product = productMap.get(String(item.productId));
        if (!product || product.quantityInStock < item.quantity) {
          throw new ApiError(409, PURCHASE_MESSAGES.INSUFFICIENT_STOCK_TO_CANCEL);
        }
      }

      for (const item of purchase.items) {
        const product = productMap.get(String(item.productId));
        const previousQuantity = product.quantityInStock;
        const newQuantity = previousQuantity - item.quantity;

        product.quantityInStock = newQuantity;
        product.updatedBy = user._id;
        await product.save({ session });

        await StockMovement.create(
          [
            {
              businessId: purchase.businessId,
              storeId: purchase.storeId,
              productId: product._id,
              type: StockMovement.TYPES.RETURN,
              quantity: item.quantity,
              previousQuantity,
              newQuantity,
              referenceId: purchase._id,
              referenceModel: "Purchase",
              reason: `Purchase ${purchase.purchaseNumber} cancelled`,
              createdBy: user._id,
            },
          ],
          { session },
        );
      }

      purchase.status = Purchase.RECORD_STATUS.CANCELLED;
      purchase.cancelledAt = new Date();
      purchase.cancelledBy = user._id;
      purchase.updatedBy = user._id;

      await purchase.save({ session });

      

      
    });
  } finally {
    await session.endSession();
  }

  return purchase.toObject();
};