import mongoose from "mongoose";
import {
  SALE_DEFAULTS,
  SALE_MESSAGES,
  SALE_SORT_FIELDS,
} from "./sales.constants.js";
import ApiError from "@/utils/ApiError";
import { SALE_STATUS } from "@/models/Sale.model";

const toNumberOrUndefined = (value) => {
  if (value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

const isNonNegativeNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const validateSaleItems = (items, errors) => {
  if (!Array.isArray(items) || items.length === 0) {
    errors.items = "At least one item is required";
    return undefined;
  }
  const parsed = [];
  const seenProductIds = new Set();

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i] || {};
    if (!mongoose.isValidObjectId(item.productId)) {
      errors.items = `Item ${i + 1}: a valid ProductId is required`;
      return undefined;
    }
    if (seenProductIds.has(String(item.productId))) {
      errors.items = SALE_MESSAGES.DUPLICATE_PRODUCT_IN_ITEMS;
      return undefined;
    }
    seenProductIds.add(String(item.productId));

    const quantity = toNumberOrUndefined(item.quantity);
    if (Number.isNaN(quantity) || quantity === undefined || quantity <= 0) {
      errors.items = `Item ${i + 1}: quantity must be a positive number`;
      return undefined;
    }

    let sellingPrice;
    if (item.sellingPrice !== undefined) {
      sellingPrice = toNumberOrUndefined(item.sellingPrice);
      if (Number.isNaN(sellingPrice) || !isNonNegativeNumber(sellingPrice)) {
        errors.items = `Item ${i + 1}: sellingPrice must be a non-negative number`;
        return undefined;
      }
    }
    parsed.push({
      productId: item.productId,
      quantity,
      ...(sellingPrice !== undefined ? { sellingPrice } : {}),
    });
  }
  return parsed;
};

export const createSaleSchema = (body = {}) => {
  const errors = {};

  if (body.storeId !== undefined && !mongoose.isValidObjectId(body.storeId)) {
    errors.storeId = "Invalid Store Id";
  }

  if (body.customerId !== undefined && body.customerId !== null) {
    if (!mongoose.isValidObjectId(body.customerId)) {
      errors.customerId = "Invalid Customer Id";
    }
  }
  const items = validateSaleItems(body.items, errors);

  let discount = 0;
  if (body.discount !== undefined) {
    discount = toNumberOrUndefined(body.discount);
    if (Number.isNaN(discount) || !isNonNegativeNumber(discount)) {
      errors.discount = "Discount must be a non-negative number";
    }
  }

  let tax = 0;
  if (body.tax !== undefined) {
    tax = toNumberOrUndefined(body.tax);
    if (Number.isNaN(tax) || !isNonNegativeNumber(tax)) {
      errors.tax = "Tax must be a non-negative number";
    }
  }

  let amountPaid;
  if (body.amountPaid !== undefined) {
    amountPaid = toNumberOrUndefined(body.amountPaid);
    if (Number.isNaN(amountPaid) || !isNonNegativeNumber(amountPaid)) {
      errors.amountPaid = "amountPaid must be a non-negative number";
    }
  }

  const allowedMethods = ["CASH", "CARD", "BANK_TRANSFER", "OTHER"];
  const paymentMethod = body.paymentMethod || "CASH";
  if (!allowedMethods.includes(paymentMethod)) {
    errors.paymentMethod = `paymentMethod must be one of: ${allowedMethods.join(", ")}`;
  }

  if (
    body.invoiceNumber !== undefined &&
    (typeof body.invoiceNumber !== "string" ||
      body.invoiceNumber.trim().length < 2)
  ) {
    errors.invoiceNumber = "Invoice number must be atleast 2 characters";
  }

  if (
    body.notes !== undefined &&
    body.notes !== null &&
    typeof body.notes !== "string"
  ) {
    errors.notes = "Notes must be a string";
  }

  if (Object.keys(errors).length) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      ...(body.storeId ? { storeId: body.storeId } : {}),
      ...(body.customerId ? { customerId: body.customerId } : {}),
      items,
      discount,
      tax,
      ...(amountPaid !== undefined ? { amountPaid } : {}),
      paymentMethod,
      ...(body.invoiceNumber
        ? { invoiceNumber: body.invoiceNumber.trim().toUpperCase() }
        : {}),
      ...(body.notes ? { notes: body.notes.trim() } : {}),
    },
  };
};

export const refundSchema = (body = {}) => {
  const errors = {};
  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.items = "At least one item to refund is required";
  }
  const parsedItems = [];
  if (Array.isArray(body.items)) {
    for (let i = 0; i < body.items.length; i += 1) {
      const item = body.items[i] || {};
      if (!mongoose.isValidObjectId(item.productId)) {
        errors.items = `Item ${i + 1}: a valid productId is required`;
        break;
      }

      const quantity = toNumberOrUndefined(item.quantity);
      if (Number.isNaN(quantity) || quantity === undefined || quantity <= 0) {
        errors.items = `Item ${i + 1}: quantity must be a positive number`;
        break;
      }

      parsedItems.push({ productId: item.productId, quantity });
    }
  }

  if (
    typeof body.reason !== "string" ||
    body.reason.trim().length < 3 ||
    body.reason.trim().length > 500
  ) {
    errors.reason = "Reason must be between 3 and 500 Characters";
  }

  return Object.keys(errors).length
    ? { success: false, errors }
    : {
        success: true,
        data: {
          items: parsedItems,
          reason: body.reason.trim(),
        },
      };
};

export const validateSaleId = (saleId) => {
  if (!mongoose.isValidObjectId(saleId)) {
    throw new ApiError(400, "Invalid Sale ID");
  }
  return saleId;
};

export const validateListSaleQuery = (query = {}) => {
  const page = Number(query.page || SALE_DEFAULTS.DEFAULT_PAGE);
  const limit = Number(query.limit || SALE_DEFAULTS.DEFAULT_LIMIT);

  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(400, "Page must be a positive integer");
  }

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > SALE_DEFAULTS.MAX_LIMIT
  ) {
    throw new ApiError(
      400,
      `Limit must be between 1 and ${SALE_DEFAULTS.MAX_LIMIT}`,
    );
  }

  const storeId = query.storeId?.trim();
  if (storeId && !mongoose.isValidObjectId(storeId)) {
    throw new ApiError(400, "Invalid Store Id");
  }

  const customerId = query.customerId?.trim();
  if (customerId && !mongoose.isValidObjectId(customerId)) {
    throw new ApiError(400, "Invalid Customer ID");
  }

  const paymentMethod = query.paymentMethod?.trim();
  const allowedMethods = ["CASH", "CARD", "BANK_TRANSFER", "OTHER"];
  if (paymentMethod && !allowedMethods.includes(paymentMethod)) {
    throw new ApiError(400, "Invalid Payment Method");
  }

  const status = query.status?.trim();
  if (status && !Object.values(SALE_STATUS).includes(status)) {
    throw new ApiError(400, "Invalid Sale Status");
  }

  let startDate;
  if (query.startDate) {
    startDate = new Date(query.startDate);
    if (Number.isNaN(startDate.getTime())) {
      throw new ApiError(400, "Start Date must be a valid date");
    }
  }

  let endDate;
  if (query.endDate) {
    endDate = new Date(query.endDate);
    if (Number.isNaN(endDate.getTime())) {
      throw new ApiError(400, "endDate must be a valid date");
    }
  }

  const search = query.search?.trim();
  if (search && search.length > SALE_DEFAULTS.MAX_SEARCH_LENGTH) {
    throw new ApiError(
      400,
      `Search Can not exceed ${SALE_DEFAULTS.MAX_SEARCH_LENGTH} characters`,
    );
  }

  const sortBy = query.sortBy?.trim() || SALE_DEFAULTS.DEFAULT_SORT_BY;
  if (!SALE_SORT_FIELDS.includes(sortBy)) {
    throw new ApiError(
      400,
      `Invalid Sort field. Allowed fields: ${SALE_SORT_FIELDS.join(", ")}`,
    );
  }

  const sortOrder =
    query.sortOrder?.trim().toLowerCase() || SALE_DEFAULTS.DEFAULT_SORT_ORDER;
  if (!["asc", "desc"].includes(sortOrder)) {
    throw new ApiError(400, "Sort Order must be either asc or desc");
  }

  return {
    page,
    limit,
    storeId: storeId || null,
    customerId: customerId || null,
    paymentMethod: paymentMethod || null,
    status: status || null,
    startDate: startDate || null,
    endDate: endDate || null,
    search: search || null,
    sortBy,
    sortOrder,
  };
};