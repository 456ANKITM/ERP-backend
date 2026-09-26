import mongoose from "mongoose";

import ApiError from "@/utils/ApiError.js";

export const updateBusinessSettingsSchema = (body = {}) => {
  const errors = {};
  const data = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 2) {
      errors.name = "Business name must be at least 2 characters";
    } else {
      data.name = body.name.trim();
    }
  }

  if (body.logo !== undefined) {
    if (body.logo === null || body.logo === "") {
      data.logo = null;
    } else if (typeof body.logo !== "string") {
      errors.logo = "Logo must be a string (URL)";
    } else {
      data.logo = body.logo.trim();
    }
  }

  if (body.currency !== undefined) {
    if (typeof body.currency !== "string" || body.currency.trim().length !== 3) {
      errors.currency = "Currency must be a 3-letter code (e.g. NPR, USD)";
    } else {
      data.currency = body.currency.trim().toUpperCase();
    }
  }

  if (body.taxRate !== undefined) {
    const taxRate = Number(body.taxRate);
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
      errors.taxRate = "Tax rate must be a number between 0 and 100";
    } else {
      data.taxRate = taxRate;
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

export const updateStoreSettingsSchema = (body = {}) => {
  const errors = {};
  const data = {};

  if (body.receiptFooter !== undefined) {
    if (body.receiptFooter === null || body.receiptFooter === "") {
      data.receiptFooter = null;
    } else if (typeof body.receiptFooter !== "string" || body.receiptFooter.trim().length > 500) {
      errors.receiptFooter = "Receipt footer must be a string of at most 500 characters";
    } else {
      data.receiptFooter = body.receiptFooter.trim();
    }
  }

  if (body.invoicePrefix !== undefined) {
    if (body.invoicePrefix === null || body.invoicePrefix === "") {
      data.invoicePrefix = null;
    } else if (
      typeof body.invoicePrefix !== "string" ||
      !/^[A-Za-z0-9_-]{1,20}$/.test(body.invoicePrefix.trim())
    ) {
      errors.invoicePrefix =
        "Invoice prefix must be 1-20 characters (letters, numbers, hyphens, underscores)";
    } else {
      data.invoicePrefix = body.invoicePrefix.trim().toUpperCase();
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

export const validateStoreId = (storeId) => {
  if (!mongoose.isValidObjectId(storeId)) {
    throw new ApiError(400, "Invalid store ID");
  }
  return storeId;
};