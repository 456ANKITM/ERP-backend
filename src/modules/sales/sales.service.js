import Store from "@/models/Store.model";
import { USER_ROLES } from "@/models/User.model";
import ApiError from "@/utils/ApiError";
import mongoose from "mongoose";
import { SALE_DEFAULTS, SALE_MESSAGES } from "./sales.constants";
import { validateListSaleQuery, validateSaleId } from "./sales.validator";
import Sale, { SALE_STATUS } from "@/models/Sale.model";
import Customer from "@/models/Customer.model";
import Product from "@/models/Product.model";
import StockMovement from "@/models/StockMovement.model";
import Business from "@/models/Business.model";
import { notifyLowStock } from "../notifications/notifications.service";

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

const toNum = (decimalOrNumber) =>
  decimalOrNumber === null || decimalOrNumber === undefined
    ? 0
    : parseFloat(decimalOrNumber.toString());

const round2 = (n) => Math.round(n * 100) / 100;

const resolveWriteStore = async ({ user, bodyStoreId }) => {
  if (user.role === USER_ROLES.STORE_MANAGER) {
    return Store.findById(user.storeId);
  }
  if (!bodyStoreId) {
    throw new ApiError(400, SALE_MESSAGES.STORE_ID_REQUIRED);
  }

  const store = await Store.findOne({
    _id: bodyStoreId,
    businessId: user.businessId,
    deletedAt: null,
    status: Store.STATUS.ACTIVE,
  });

  if (!store) {
    throw new ApiError(404, SALE_MESSAGES.STORE_NOT_FOUND);
  }

  return store;
};

const resolveReadStoreFilter = (user, queryStoreId) => {
  if (user.role === USER_ROLES.STORE_MANAGER) {
    return user.storeId;
  }
  return queryStoreId || null;
};

const findScopedSale = async ({ user, saleId }) => {
  validateSaleId(saleId);
  const filter = {
    _id: saleId,
    businessId: user.businessId,
  };
  if (user.role === USER_ROLES.STORE_MANAGER) {
    filter.storeId = user.storeId;
  }
  const sale = await Sale.findOne(filter);
  if (!sale) {
    throw new ApiError(404, SALE_MESSAGES.SALE_NOT_FOUND);
  }
  return sale;
};

const generateInvoiceNumber = async ({
  businessId,
  storeId,
  storeCode,
  session,
}) => {
  for (
    let attempt = 0;
    attempt < SALE_DEFAULTS.NUMBER_GENERATION_MAX_ATTEMPTS;
    attempt += 1
  ) {
    const count = await Sale.countDocuments({ businessId, storeId }).session(
      session,
    );
    const sequence = String(count + 1 + attempt).padStart(5, "0");
    const candidate = `INV-${storeCode}-${sequence}`;
    const exists = await Sale.findOne({
      businessId,
      storeId,
      invoiceNumber: candidate,
    }).session(session);
    if (!exists) {
      return candidate;
    }
  }

  throw new ApiError(500, SALE_MESSAGES.NUMBER_GENERATION_FAILED);
};

export const createSale = async ({ user, data }) => {
  const store = await resolveWriteStore({ user, bodyStoreId: data.storeId });
  const storeId = store._id;

  let customer = null;
  if (data.customerId) {
    customer = await Customer.findOne({
      _id: data.customerId,
      businessId: user.businessId,
      storeId,
      deletedAt: null,
    });

    if (!customer) {
      throw new ApiError(404, SALE_MESSAGES.CUSTOMER_NOT_FOUND);
    }
  }
  const session = await mongoose.startSession();

  let createdSale;
  try {
    await session.withTransaction(async () => {
      const productIds = data.items.map((item) => item.productId);
      const products = await Product.find({
        _id: { $in: productIds },
        businessId: user.businessId,
        storeId,
        deletedAt: null,
      }).session(session);

      const productMap = new Map(products.map((p) => [String(p._id), p]));

      if (productMap.size !== productIds.length) {
        throw new ApiError(404, SALE_MESSAGES.PRODUCT_NOT_FOUND);
      }

      const inSufficientItems = [];
      for (const item of data.items) {
        const product = productMap.get(String(item.productId));
        if (product.quantityInStock < item.quantity) {
          inSufficientItems.push({
            productId: product._id,
            name: product.name,
            sku: product.sku,
            requested: item.quantity,
            available: product.quantityInStock,
          });
        }
      }

      if (inSufficientItems.length) {
        throw new ApiError(
          409,
          SALE_MESSAGES.INSUFFICIENT_STOCK,
          inSufficientItems,
        );
      }

      const lineItems = data.items.map((item) => {
        const product = productMap.get(String(item.productId));
        const sellingPrice =
          item.sellingPrice !== undefined
            ? item.sellingPrice
            : toNum(product.sellingPrice);
        const subtotal = round2(sellingPrice * item.quantity);
        return {
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          quantity: item.quantity,
          sellingPrice,
          subtotal,
          refundedQuantity: 0,
        };
      });
      const itemsSubtotal = round2(
        lineItems.reduce((sum, item) => sum + item.subtotal, 0),
      );
      const totalAmount = round2(itemsSubtotal - data.discount + data.tax);
      if (totalAmount < 0) {
        throw new ApiError(400, SALE_MESSAGES.DISCOUNT_TOO_HIGH);
      }
      const amountPaid =
        data.amountPaid !== undefined ? data.amountPaid : totalAmount;
      if (amountPaid > totalAmount) {
        throw new ApiError(400, SALE_MESSAGES.AMOUNT_EXCEEDS_TOTAL);
      }
      const amountDue = round2(totalAmount - amountPaid);
      let paymentStatus = Sale.PAYMENT_STATUS.UNPAID;
      if (amountDue <= 0) paymentStatus = Sale.PAYMENT_STATUS.PAID;
      else if (amountPaid > 0) paymentStatus = Sale.PAYMENT_STATUS.PARTIAL;

      const invoiceNumber =
        data.invoiceNumber ||
        (await generateInvoiceNumber({
          businessId: user.businessId,
          storeId,
          storeCode: store.code,
          session,
        }));
      const [sale] = await Sale.create(
        [
          {
            businessId: user.businessId,
            storeId,
            customerId: customer?._id ?? null,
            invoiceNumber,
            items: lineItems,
            subtotal: itemsSubtotal,
            discount: data.discount,
            tax: data.tax,
            totalAmount,
            amountPaid,
            amountDue,
            paymentMethod: data.paymentMethod,
            paymentStatus,
            soldBy: user._id,
            notes: data.notes ?? null,
          },
        ],
        { session },
      );

      for (const item of lineItems) {
        const product = productMap.get(String(item.productId));
        const previousQuantity = product.quantityInStock;
        const newQuantity = previousQuantity - item.quantity;
        product.quantityInStock = newQuantity;
        product.updatedBy = user._id;
        await product.save({ session });

        const crossedIntoLow =
  previousQuantity > product.recorderLevel && newQuantity <= product.recorderLevel;

if (crossedIntoLow) {
  // Fire-and-forget outside the transaction's atomicity concerns —
  // a notification failing shouldn't roll back a completed sale.
  notifyLowStock({ businessId: product.businessId, storeId, product }).catch(() => {});
}

        await StockMovement.create(
          [
            {
              businessId: user.businessId,
              storeId,
              productId: product._id,
              type: StockMovement.TYPES.SALE,
              quantity: item.quantity,
              previousQuantity,
              newQuantity,
              referenceId: sale._id,
              referenceModel: "Sale",
              reason: `Sale ${sale.invoiceNumber}`,
              createdBy: user._id,
            },
          ],
          { session },
        );
      }
      createdSale = sale;
    });
  } finally {
    await session.endSession();
  }
  return createdSale.toObject();
};

export const listSales = async ({ user, query }) => {
  const {
    page,
    limit,
    storeId: queryStoreId,
    customerId,
    paymentMethod,
    status,
    startDate,
    endDate,
    search,
    sortBy,
    sortOrder,
  } = validateListSaleQuery(query);
  const storeFilter = resolveReadStoreFilter(user, queryStoreId);
  const skip = (page - 1) * limit;
  const filter = { businessId: user.businessId };
  if (storeFilter) filter.storeId = storeFilter;
  if (customerId) filter.customerId = customerId;
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (status) filter.status = status;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = startDate;
    if (endDate) filter.createdAt.$lte = endDate;
  }
  if (search) {
    filter.invoiceNumber = {
      $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
  sort._id = sortOrder === "asc" ? 1 : -1;

  const [sales, total] = await Promise.all([
    Sale.find(filter)
      .populate({ path: "customerId", select: "name phone" })
      .populate({ path: "storeId", select: "name code" })
      .select("-items")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Sale.countDocuments(filter),
  ]);
  return { sales, pagination: buildPagination({ page, limit, total }) };
};

export const getSaleDetails = async ({ user, saleId }) => {
  const sale = await findScopedSale({ user, saleId });

  await sale.populate([
    { path: "customerId", select: "name phone email" },
    { path: "storeId", select: "name code" },
    { path: "soldBy", select: "name email" },
  ]);
  return { sale: sale.toObject() };
};

export const refundSale = async ({ user, saleId, data }) => {
  const sale = await findScopedSale({ user, saleId });
  if (sale.status === SALE_STATUS.REFUNDED) {
    throw new ApiError(409, SALE_MESSAGES.ALREADY_FULLY_REFUNDED);
  }
  const session = await mongoose.startSession();
  let refundedAmount = 0;
  try {
    await session.withTransaction(async () => {
      const lineByProductId = new Map(
        sale.items.map((item, index) => [String(item.productId), index]),
      );
      // validate every requested item before changing anything
      for (const requested of data.items) {
        const index = lineByProductId.get(String(requested.productId));
        if (index === undefined) {
          throw new ApiError(400, SALE_MESSAGES.REFUND_ITEM_NOT_IN_SALE);
        }
        const line = sale.items[index];
        const remaining = line.quantity - line.refundedQuantity;
        if (requested.quantity > remaining) {
          throw new ApiError(
            400,
            SALE_MESSAGES.REFUND_QUANTITY_EXCEEDS_REMAINING,
            {
              productId: requested.productId,
              remaining,
            },
          );
        }
      }
      const productIds = data.items.map((item) => item.productId);
      const products = await Product.find({
        _id: { $in: productIds },
      }).session(session);
      const productMap = new Map(products.map((p) => [String(p._id), p]));
      for (const requested of data.items) {
        const index = lineByProductId.get(String(requested.productId));
        const line = sale.items[index];
        const lineRefundAmount = round2(
          toNum(line.sellingPrice) * requested.quantity,
        );
        refundedAmount = round2(refundedAmount + lineRefundAmount);
        line.refundedQuantity += requested.quantity;
        const product = productMap.get(String(requested.productId));
        if (product) {
          const previousQuantity = product.quantityInStock;
          const newQuantity = previousQuantity + requested.quantity;
          product.quantityInStock = newQuantity;
          product.updatedBy = user._id;
          await product.save({ session });
          await StockMovement.create(
            [
              {
                businessId: sale.businessId,
                storeId: sale.storeId,
                productId: product._id,
                type: StockMovement.TYPES.RETURN,
                quantity: requested.quantity,
                previousQuantity,
                newQuantity,
                referenceId: sale._id,
                referenceModel: "Sale",
                reason: `Refund on ${sale.invoiceNumber}: ${data.reason}`,
                createdBy: user._id,
              },
            ],
            { session },
          );
        }
      }
      sale.amountRefunded = round2(toNum(sale.amountRefunded) + refundedAmount);
      const allFullyRefunded = sale.items.every(
        (item) => item.refundedQuantity >= item.quantity,
      );
      const anyRefunded = sale.items.some((item) => item.refundedQuantity > 0);
      sale.status = allFullyRefunded
        ? SALE_STATUS.REFUNDED
        : anyRefunded
          ? SALE_STATUS.PARTIALLY_REFUNDED
          : SALE_STATUS.COMPLETED;
      sale.updatedBy = user._id;
      await sale.save({ session });
    });
  } finally {
    await session.endSession();
  }
  return { sale: sale.toObject(), refundedAmount };
};

export const getInvoiceData = async ({ user, saleId }) => {
  const sale = await findScopedSale({ user, saleId });
  await sale.populate([
    { path: "customerId", select: "name phone email" },
    { path: "storeId", select: "name code" },
  ]);
  const business = await Business.findById(sale.businessId).lean();
  return {
    sale: sale.toObject(),
    business,
    store: sale.storeId,
    customer: sale.customerId,
  };
};