import mongoose from "mongoose";

import Product from "@/models/Product.model";
import ApiError from "@/utils/ApiError";

import {
  PRODUCT_SORT_FIELDS,
  PRODUCT_DEFAULTS,
  STOCK_STATUS_FILTERS,
} from "./products.constants.js";

const isNonNegativeNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const toNumberOrUndefined = (value) => {
  if (value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

export const createProductSchema = (body = {}) => {
  const errors = {};
  if (typeof body.name !== "string" || body.name.trim().length < 2) {
    errors.name = "Product name must be at least 2 characters";
  }
  if (typeof body.sku !== "string" || body.sku.trim().length === 0) {
    errors.sku = "SKU code is required";
  }
  if (typeof body.unit !== "string" || body.unit.trim().length === 0) {
    errors.unit = "Unit is a required";
  }
  const costPrice = toNumberOrUndefined(body.costPrice);
  if (costPrice === undefined || Number.isNaN(costPrice) || costPrice < 0) {
    errors.costPrice = "A Valid, non-negative cost price is required";
  }

  const sellingPrice = toNumberOrUndefined(body.sellingPrice);
  if (
    sellingPrice === undefined ||
    Number.isNaN(sellingPrice) ||
    sellingPrice < 0
  ) {
    errors.sellingPrice = "A valid, non-negative sellingg price is required";
  }

  let quantityInStock = 0;
  if (body.quantityInStock !== undefined) {
    quantityInStock = toNumberOrUndefined(body.quantityInStock);
    if (Number.isNaN(quantityInStock) || !isNonNegativeNumber(quantityInStock)) {
      errors.quantityInStock =
        "Quantity in stock must be a non-negative number";
    }
  }

  let recorderLevel = 0;
  if (body.recorderLevel !== undefined) {
    recorderLevel = toNumberOrUndefined(body.recorderLevel);
    if (Number.isNaN(recorderLevel) || !isNonNegativeNumber(recorderLevel)) {
      errors.recorderLevel = "Recorder level must be a non-negative number";
    }
  }

  if (body.categoryId !== undefined && body.categoryId !== null) {
    if (!mongoose.isValidObjectId(body.categoryId)) {
      errors.categoryId = "Invalid Category Id";
    }
  }

  if (body.storeId !== undefined && !mongoose.isValidObjectId(body.storeId)) {
    errors.storeId = "Invalid Store ID";
  }

  if (body.description !== undefined && typeof body.description !== "string") {
    errors.description = "Description must be an string";
  }

  if (body.barcode !== undefined && body.barcode !== null) {
    if (typeof body.barcode !== "string") {
      errors.barcode = "Barcode must be an string";
    }
  }

  if (Object.keys(errors).length) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name: body.name.trim(),
      sku: body.sku.trim().toUpperCase(),
      unit: body.unit.trim().toLowerCase(),
      costPrice,
      sellingPrice,
      quantityInStock,
      recorderLevel,
      ...(body.storeId ? { storeId: body.storeId } : {}),
      ...(body.categoryId ? { categoryId: body.categoryId } : {}),
      ...(body.description !== undefined
        ? { description: body.description.trim() }
        : {}),
      ...(body.barcode ? { barcode: body.barcode.trim() } : {}),
    },
  };
};

export const updateProductSchema = (body = {}) => {
  const errors = {};
  const data = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim() < 2) {
      errors.name = "Product name must be at least 2 characters";
    } else {
      data.name = body.name.trim();
    }
  }

  if (body.description !== undefined) {
    if (body.description === null) {
      data.description = null;
    } else if (typeof body.description !== "string") {
      errors.description = "Description must be a string";
    } else {
      data.description = body.description.trim();
    }
  }

  if (body.unit !== undefined) {
    if (typeof body.unit !== "string" || body.unit.trim().length === 0) {
      errors.unit = "Unit must be a non-empty string";
    } else {
      data.unit = body.unit.trim().toLowerCase();
    }
  }

  if (body.costPrice !== undefined) {
    const costPrice = toNumberOrUndefined(body.costPrice);
    if (Number.isNaN(costPrice) || !isNonNegativeNumber(costPrice)) {
      errors.costPrice = "Cost price must be a non-negative number";
    } else {
      data.costPrice = costPrice;
    }
  }

  if (body.sellingPrice !== undefined) {
    const sellingPrice = toNumberOrUndefined(body.sellingPrice);
    if (Number.isNaN(sellingPrice) || !isNonNegativeNumber(sellingPrice)) {
      errors.sellingPrice = "Selling price must be a non-negative number";
    } else {
      data.sellingPrice = sellingPrice;
    }
  }

  if (body.recorderLevel !== undefined) {
    const recorderLevel = toNumberOrUndefined(body.recorderLevel);
    if (Number.isNaN(recorderLevel) || !isNonNegativeNumber(recorderLevel)) {
      errors.recorderLevel = "Reorder level must be a non-negative number";
    } else {
      data.recorderLevel = recorderLevel;
    }
  }

  if (body.categoryId !== undefined) {
    if (body.categoryId === null) {
      data.categoryId = null;
    } else if (!mongoose.isValidObjectId(body.categoryId)) {
      errors.categoryId = "Invalid category ID";
    } else {
      data.categoryId = body.categoryId;
    }
  }

  if (body.barcode !== undefined) {
    if (body.barcode === null || body.barcode === "") {
      data.barcode = null;
    } else if (typeof body.barcode !== "string") {
      errors.barcode = "Barcode must be a string";
    } else {
      data.barcode = body.barcode.trim();
    }
  }

  if (Object.keys(errors).length) {
    return { success: false, errors };
  }

  if (Object.keys(data).length === 0) {
    return {
      success: false,
      errors: { body: "At least one field must be provided to update" },
    };
  }

  return { success: true, data };
};

export const adjustStockSchema = (body = {}) => {
  const errors = {};

  const quantityChange = toNumberOrUndefined(body.quantityChange);
  if (
    quantityChange === undefined ||
    Number.isNaN(quantityChange) ||
    quantityChange === 0
  ) {
    errors.quantityChange = "quantityChange must be a non-zero number";
  }

  if (
    typeof body.reason !== "string" ||
    body.reason.trim().length < 3 ||
    body.reason.trim().length > 500
  ) {
    errors.reason = "Reason must be between 3 and 500 characters";
  }

  return Object.keys(errors).length
    ? { success: false, errors }
    : {
        success: true,
        data: { quantityChange, reason: body.reason.trim() },
      };
};

export const validateProductId = (productId) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }
  return productId;
};

export const validateListProductsQuery = (query = {}) => {
  const page = Number(query.page || PRODUCT_DEFAULTS.DEFAULT_PAGE);
  const limit = Number(query.limit || PRODUCT_DEFAULTS.DEFAULT_LIMIT);
  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(400, "Page must be a positive integer");
  }
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > PRODUCT_DEFAULTS.MAX_LIMIT
  ) {
    throw new ApiError(
      400,
      `Limit must be between 1 and ${PRODUCT_DEFAULTS.MAX_LIMIT}`,
    );
  }
  const status = query.status?.trim();
  if (status && !Object.values(Product.STATUS).includes(status)) {
    throw new ApiError(400, "Invalid product status");
  }
  const categoryId = query.categoryId?.trim();
  if (categoryId && !mongoose.isValidObjectId(categoryId)) {
    throw new ApiError(400, "Invalid category ID");
  }
  const storeId = query.storeId?.trim();
  if (storeId && !mongoose.isValidObjectId(storeId)) {
    throw new ApiError(400, "Invalid store ID");
  }
  const stockStatus = query.stockStatus?.trim().toUpperCase();
  if (stockStatus && !STOCK_STATUS_FILTERS.includes(stockStatus)) {
    throw new ApiError(
      400,
      `stockStatus must be one of: ${STOCK_STATUS_FILTERS.join(", ")}`,
    );
  }
  const search = query.search?.trim();
  if (search && search.length > PRODUCT_DEFAULTS.MAX_SEARCH_LENGTH) {
    throw new ApiError(
      400,
      `Search cannot exceed ${PRODUCT_DEFAULTS.MAX_SEARCH_LENGTH} characters`,
    );
  }
  const sortBy = query.sortBy?.trim() || PRODUCT_DEFAULTS.DEFAULT_SORT_BY;
  if (!PRODUCT_SORT_FIELDS.includes(sortBy)) {
    throw new ApiError(
      400,
      `Invalid sort field. Allowed fields: ${PRODUCT_SORT_FIELDS.join(", ")}`,
    );
  }
  const sortOrder =
    query.sortOrder?.trim().toLowerCase() ||
    PRODUCT_DEFAULTS.DEFAULT_SORT_ORDER;
  if (!["asc", "desc"].includes(sortOrder)) {
    throw new ApiError(400, "Sort order must be either asc or desc");
  }
  return {
    page,
    limit,
    status: status || null,
    categoryId: categoryId || null,
    storeId: storeId || null,
    stockStatus: stockStatus || null,
    search: search || null,
    sortBy,
    sortOrder,
  };
};

export const validateLowStockQuery = (query = {}) => {
  const page = Number(query.page || PRODUCT_DEFAULTS.DEFAULT_PAGE);
  const limit = Number(query.limit || PRODUCT_DEFAULTS.DEFAULT_LIMIT);
  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(400, "Page must be a positive integer");
  }
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > PRODUCT_DEFAULTS.MAX_LIMIT
  ) {
    throw new ApiError(
      400,
      `Limit must be between 1 and ${PRODUCT_DEFAULTS.MAX_LIMIT}`,
    );
  }
  const storeId = query.storeId?.trim();
  if (storeId && !mongoose.isValidObjectId(storeId)) {
    throw new ApiError(400, "Invalid store ID");
  }

  return { page, limit, storeId: storeId || null };
};
