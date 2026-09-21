import Product, { PRODUCT_STATUS } from "@/models/Product.model.js";
import Category from "@/models/Category.model.js";
import Store from "@/models/Store.model.js";
import StockMovement from "@/models/StockMovement.model.js";
import { USER_ROLES } from "@/models/User.model.js";

import ApiError from "@/utils/ApiError.js";

import { PRODUCT_MESSAGES, PRODUCT_DEFAULTS } from "./products.constants.js";
import {
  validateProductId,
  validateListProductsQuery,
  validateLowStockQuery,
} from "./products.validator.js";

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

const resolveWriteStoreId = async ({ user, bodyStoreId }) => {
  if (user.role === USER_ROLES.STORE_MANAGER) {
    return user.storeId;
  }
  if (!bodyStoreId) {
    throw new ApiError(400, PRODUCT_MESSAGES.STORE_ID_REQUIRED);
  }
  const store = await Store.findOne({
    _id: bodyStoreId,
    businessId: user.businessId,
    deletedAt: null,
    status: Store.STATUS.ACTIVE,
  });
  if (!store) {
    throw new ApiError(404, PRODUCT_MESSAGES.STORE_NOT_FOUND);
  }

  return store._id;
};

const resolveReadStoreFilter = (user, queryStoreId) => {
  if (user.role === USER_ROLES.STORE_MANAGER) {
    return user.storeId;
  }
  return queryStoreId || null;
};

const assertCategoryInScope = async ({ businessId, storeId, categoryId }) => {
  const category = await Category.findOne({
    _id: categoryId,
    businessId,
    storeId,
    deletedAt: null,
  });

  if (!category) {
    throw new ApiError(404, PRODUCT_MESSAGES.CATEGORY_NOT_FOUND);
  }

  return category;
};

const findScopedProduct = async ({ user, productId }) => {
  validateProductId(productId);
  const filter = {
    _id: productId,
    businessId: user.businessId,
    deletedAt: null,
  };
  if (user.role === USER_ROLES.STORE_MANAGER) {
    filter.storeId = user.storeId;
  }
  const product = await Product.findOne(filter);
  if (!product) {
    throw new ApiError(404, PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
  }

  return product;
};

export const createProduct = async ({ user, data }) => {
  const storeId = await resolveWriteStoreId({
    user,
    bodyStoreId: data.storeId,
  });
  if (data.categoryId) {
    await assertCategoryInScope({
      businessId: user.businessId,
      storeId,
      categoryId: data.categoryId,
    });
  }
  const existingSku = await Product.findOne({
    businessId: user.businessId,
    storeId,
    sku: data.sku,
    deletedAt: null,
  });
  if (existingSku) {
    throw new ApiError(409, PRODUCT_MESSAGES.SKU_TAKEN);
  }
  if (data.barcode) {
    const existingBarcode = await Product.findOne({
      businessId: user.businessId,
      storeId,
      barcode: data.barcode,
      deletedAt: null,
    });

    if (existingBarcode) {
      throw new ApiError(409, PRODUCT_MESSAGES.BARCODE_TAKEN);
    }
  }
  const product = await Product.create({
    ...data,
    businessId: user.businessId,
    storeId,
    createdBy: user._id,
  });
  if (product.quantityInStock > 0) {
    await StockMovement.create({
      businessId: user.businessId,
      storeId,
      productId: product._id,
      type: StockMovement.TYPES.ADJUSTMENT,
      quantity: product.quantityInStock,
      previousQuantity: 0,
      newQuantity: product.quantityInStock,
      reason: "Initial stock on product creation",
      createdBy: user._id,
    });
  }
  return product.toObject();
};

export const listProducts = async ({ user, query }) => {
  const {
    page,
    limit,
    status,
    categoryId,
    storeId: queryStoreId,
    stockStatus,
    search,
    sortBy,
    sortOrder,
  } = validateListProductsQuery(query);
  const storeFilter = resolveReadStoreFilter(user, queryStoreId);
  const skip = (page - 1) * limit;
  const filter = {
    businessId: user.businessId,
    deletedAt: null,
  };
  if (storeFilter) filter.storeId = storeFilter;
  if (status) filter.status = status;
  if (categoryId) filter.categoryId = categoryId;
  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { sku: { $regex: safeSearch, $options: "i" } },
    ];
  }
  if (stockStatus === "OUT") {
    filter.quantityInStock = 0;
  } else if (stockStatus === "LOW") {
    filter.$expr = {
      $and: [
        { $gt: ["$quantityInStock", 0] },
        { $lte: ["$quantityInStock", "$recorderLevel"] },
      ],
    };
  } else if (stockStatus === "NORMAL") {
    filter.$expr = { $gt: ["$quantityInStock", "$recorderLevel"] };
  }
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
  sort._id = sortOrder === "asc" ? 1 : -1;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate({ path: "categoryId", select: "name status" })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  return { products, pagination: buildPagination({ page, limit, total }) };
};

export const getProductDetails = async ({ user, productId }) => {
  const product = await findScopedProduct({ user, productId });

  await product.populate({ path: "categoryId", select: "name status" });
  const stockHistory = await StockMovement.find({ productId: product._id })
    .sort({ createdAt: -1 })
    .limit(PRODUCT_DEFAULTS.STOCK_HISTORY_LIMIT)
    .populate({ path: "createdBy", select: "name email" })
    .lean();

  return {
    product: product.toObject(),
    stockHistory,
  };
};

export const updateProduct = async ({ user, productId, data }) => {
  const product = await findScopedProduct({ user, productId });
  if (data.categoryId) {
    await assertCategoryInScope({
      businessId: product.businessId,
      storeId: product.storeId,
      categoryId: data.categoryId,
    });
  }
  if (data.barcode && data.barcode !== product.barcode) {
    const existingBarcode = await Product.findOne({
      businessId: product.businessId,
      storeId: product.storeId,
      barcode: data.barcode,
      deletedAt: null,
      _id: { $ne: product._id },
    });

    if (existingBarcode) {
      throw new ApiError(409, PRODUCT_MESSAGES.BARCODE_TAKEN);
    }
  }
  Object.assign(product, data);
  product.updatedBy = user._id;

  await product.save();

  return product.toObject();
};

export const deactivateProduct = async ({ user, productId }) => {
  const product = await findScopedProduct({ user, productId });
  if (product.status === Product.STATUS.INACTIVE) {
    throw new ApiError(409, PRODUCT_MESSAGES.ALREADY_INACTIVE);
  }
  product.status = Product.STATUS.INACTIVE;
  product.deletedAt = new Date();
  product.deletedBy = user._id;
  product.updatedBy = user._id;

  await product.save();

  return product.toObject();
};

export const adjustStock = async ({
  user,
  productId,
  quantityChange,
  reason,
}) => {
  const product = await findScopedProduct({ user, productId });
  const previousQuantity = product.quantityInStock;
  const newQuantity = previousQuantity + quantityChange;
  if (newQuantity < 0) {
    throw new ApiError(400, PRODUCT_MESSAGES.NEGATIVE_STOCK);
  }
  product.quantityInStock = newQuantity;
  product.updatedBy = user._id;

  await product.save();

  const movement = await StockMovement.create({
    businessId: product.businessId,
    storeId: product.storeId,
    productId: product._id,
    type: StockMovement.TYPES.ADJUSTMENT,
    quantity: Math.abs(quantityChange),
    previousQuantity,
    newQuantity,
    reason,
    createdBy: user._id,
  });

  return {
    product: product.toObject(),
    movement: movement.toObject(),
  };
};

export const listLowStockProducts = async ({ user, query }) => {
  const { page, limit, storeId: queryStoreId } = validateLowStockQuery(query);
  const storeFilter = resolveReadStoreFilter(user, queryStoreId);
  const skip = (page - 1) * limit;
  const filter = {
    businessId: user.businessId,
    deletedAt: null,
    status: PRODUCT_STATUS.ACTIVE,
    $expr: { $lte: ["$quantityInStock", "$recorederLevel"] },
  };
  if (storeFilter) filter.storeId = storeFilter;
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate({ path: "categoryId", select: "name status" })
      .sort({ quantityInStock: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  return { products, pagination: buildPagination({ page, limit, total }) };
};
