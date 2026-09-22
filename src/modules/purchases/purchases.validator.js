import ApiError from "@/utils/ApiError";
import mongoose from "mongoose";
import { PURCHASE_DEFAULTS, PURCHASE_SORT_FIELDS } from "./purchases.constants";
import { PAYMENT_STATUS, PURCHASE_RECORD_STATUS } from "@/models/Purchase.model";

const toNumberOrUndefined = (value) => {
  if (value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

const isNonNegativeNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const validateItems = (items, errors) => {
  if (!Array.isArray(items) || items.length === 0) {
    errors.items = "At least one item is required";
    return undefined;
  }
  const parsed = [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i] || {};
    if (!mongoose.isValidObjectId(item.productId)) {
      errors.items = `Item ${i + 1}: a valid productId is required`;
      return undefined;
    }
    const quantity = toNumberOrUndefined(item.quantity);
    if (Number.isNaN(quantity) || quantity === undefined || quantity <= 0) {
      errors.items = `Item ${i + 1}: quantity must be a positive number`;
      return undefined;
    }
    let costPrice;
    if (item.costPrice !== undefined) {
      costPrice = toNumberOrUndefined(item.costPrice);
      if (Number.isNaN(costPrice) || !isNonNegativeNumber(costPrice)) {
        errors.items = `Item ${i + 1}: costPrice must be a non-negative number`;
        return undefined;
      }
    }
    parsed.push({
      productId: item.productId,
      quantity,
      ...(costPrice !== undefined ? { costPrice } : {}),
    });
  }
  return parsed;
};

export const createPurchaseSchema = (body = {}) => {
  const errors = {};
  if (!mongoose.isValidObjectId(body.supplierId)) {
    errors.supplierId = "A Valid supplierId is required";
  }
  if (body.storeId !== undefined && !mongoose.isValidObjectId(body.storeId)) {
    errors.storeId = "Invalid Store Id";
  }
  const items = validateItems(body.items, errors);

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

  let amountPaid = 0;
  if (body.amountPaid !== undefined) {
    amountPaid = toNumberOrUndefined(body.amountPaid);
    if (Number.isNaN(amountPaid) || !isNonNegativeNumber(amountPaid)) {
      errors.amountPaid = "amountPaid must be a non-negative number";
    }
  }

  let purchaseDate = new Date();
  if (body.purchaseDate !== undefined) {
    const parsedDate = new Date(body.purchaseDate);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.purchaseDate = "purchaseDate must be a valid date";
    } else {
      purchaseDate = parsedDate;
    }
  }

  if (
    body.purchaseNumber !== undefined &&
    (typeof body.purchaseNumber !== "string" ||
      body.purchaseNumber.trim().length < 2)
  ) {
    errors.purchaseNumber = "purchaseNumber must be at least 2 characters";
  }

  if (body.notes !== undefined && body.notes !== null) {
    if (typeof body.notes !== "string") {
      errors.notes = "Notes Must be a String";
    }
  }

  if (Object.keys(errors).length) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      supplierId: body.supplierId,
      ...(body.storeId ? { storeId: body.storeId } : {}),
      items,
      discount,
      tax,
      amountPaid,
      purchaseDate,
      ...(body.purchaseNumber
        ? { purchaseNumber: body.purchaseNumber.trim().toUpperCase() }
        : {}),
      ...(body.notes ? { notes: body.notes.trim() } : {}),
    },
  };
};

export const updatePaymentStatusSchema = (body = {}) => {
  const errors = {};
  const allowedStatuses = ["UNPAID", "PARTIAL", "PAID"];

  if (
    typeof body.status !== "string" ||
    !allowedStatuses.includes(body.status)
  ) {
    errors.status = `Status must be one of : ${allowedStatuses.join(", ")}`;
  }

  let amountPaid;
  if (body.status === "PARTIAL") {
    amountPaid = toNumberOrUndefined(body.amountPaid);
    if (
      amountPaid === undefined ||
      Number.isNaN(amountPaid) ||
      !isNonNegativeNumber(amountPaid)
    ) {
      errors.amountPaid = "amountPaid is required when status is PARTIAL";
    }
  } else if (body.amountPaid !== undefined) {
    amountPaid = toNumberOrUndefined(body.amountPaid);
    if (Number.isNaN(amountPaid) || !isNonNegativeNumber(amountPaid)) {
      errors.amountPaid = "amountPaid must be a non-negative number";
    }
  }
  return Object.keys(errors).length
    ? { success: false, errors }
    : {
        success: true,
        data: {
          status: body.status,
          ...(amountPaid !== undefined ? { amountPaid } : {}),
        },
      };
};

export const validatePurchaseId = (purchaseId) => {
  if (!mongoose.isValidObjectId(purchaseId)) {
    throw new ApiError(400, "Invalid Purchase Id");
  }
  return purchaseId;
};

export const validateListPurchasesQuery = (query = {}) => {
    const page = Number(query.page || PURCHASE_DEFAULTS.DEFAULT_PAGE); 
    const limit = Number(query.limit || PURCHASE_DEFAULTS.DEFAULT_LIMIT); 

    if(!Number.isInteger(page) || page < 1) {
        throw new ApiError(400, "Page must be a positive integer")
    }

    if(!Number.isInteger(limit) || limit < 1 || limit > PURCHASE_DEFAULTS.MAX_LIMIT) {
        throw new ApiError(400, `Limit must be between 1 and ${PURCHASE_DEFAULTS.MAX_LIMIT}`)
    }
    
    const supplierId = query.supplierId?.trim(); 
    if (supplierId && !mongoose.isValidObjectId(supplierId)) {
        throw new ApiError(400, "Invalid Supplier Id")
    }

    const storeId = query.storeId?.trim();
    if(storeId && !mongoose.isValidObjectId(storeId)) {
        throw new ApiError(400, "Invalid Store ID")
    }

    const paymentStatus = query.paymentStatus?.trim();
    if (
        paymentStatus && 
        !Object.values(PAYMENT_STATUS).includes(paymentStatus)
    ) {
        throw new ApiError(400, "Invalid Payment Status")
    }

    const status = query.status?.trim(); 
    if(status && !Object.values(PURCHASE_RECORD_STATUS).includes(status)) {
        throw new ApiError(400, "Invalid Purchase Status")
    }

    let startDate; 
    if (query.startDate) {
        startDate = new Date(query.startDate); 
        if (Number.isNaN(startDate.getTime())) {
            throw new ApiError(400, "Start Date must be a valid date")
        }
    }

    let endDate; 
    if(query.endDate) {
        endDate  = new Date(query.endDate); 
        if(Number.isNaN(endDate.getTime())) {
            throw new ApiError(400, "end date must be a Valid date")
        }
    }

    const search = query.search?.trim(); 
    if(search && search.length > PURCHASE_DEFAULTS.MAX_SEARCH_LENGTH){
        throw new ApiError(400, `Search Can not exceed ${PURCHASE_DEFAULTS.MAX_SEARCH_LENGTH} characters`)
    }

    const sortBy = query.sortBy?.trim() || PURCHASE_DEFAULTS.DEFAULT_SORT_BY;  
    if(!PURCHASE_SORT_FIELDS.includes(sortBy)) {
        throw new ApiError(400, `Invalid sort field, Allowed fields: ${PURCHASE_SORT_FIELDS.join(", ")}`)
    }

    const sortOrder = query.sortOrder?.trim().toLowerCase() || PURCHASE_DEFAULTS.DEFAULT_SORT_ORDER; 
    if(!["asc", "desc"].includes(sortOrder)) {
        throw new ApiError(400, "Sort Order must be either asc or desc")
    }

    return {
        page, 
        limit, 
        supplierId: supplierId || null, 
        storeId: storeId || null, 
        paymentStatus: paymentStatus || null, 
        status: status || null, 
        startDate: startDate || null, 
        endDate: endDate || null, 
        search : search || null, 
        sortBy, 
        sortOrder
    }
}
