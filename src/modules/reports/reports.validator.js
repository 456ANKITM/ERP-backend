import ApiError from "@/utils/ApiError";
import mongoose from "mongoose";
import {
  REPORT_DEFAULTS,
  REPORT_FORMATS,
  REPORT_GROUP_BY,
  REPORT_TYPES,
  TOP_PRODUCTS_SORT_FIELDS,
} from "./reports.constants";

const parseDateRange = (query) => {
  const now = new Date();

  let endDate = now;
  if (query.endDate) {
    endDate = new Date(query.endDate);
    if (Number.isNaN(endDate.getTime())) {
      throw new ApiError(400, "endDate must be a valid date");
    }
  }

  let startDate = new Date(
    endDate.getTime() -
      REPORT_DEFAULTS.DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000,
  );
  if (query.startDate) {
    startDate = new Date(query.startDate);
    if (Number.isNaN(startDate.getTime())) {
      throw new ApiError(400, "startDate must be a valid date");
    }
  }
  if (startDate > endDate) {
    throw new ApiError(400, "startDate must be before or equal to end Date");
  }
  return { startDate, endDate };
};

const parseStoreId = (query) => {
  const storeId = query.storeId?.trim();
  if (storeId && !mongoose.isValidObjectId(storeId)) {
    throw new ApiError(400, "Invalid Store ID");
  }
  return storeId || null;
};

export const validateSalesSummaryQuery = (query = {}) => {
  const { startDate, endDate } = parseDateRange(query);
  const storeId = parseStoreId(query);
  const groupBy = query.groupBy?.trim() || REPORT_DEFAULTS.DEFAULT_GROUP_BY;
  if (!REPORT_GROUP_BY.includes(groupBy)) {
    throw new ApiError(
      400,
      `groupBy must be one of: ${REPORT_GROUP_BY.join(", ")}`,
    );
  }
  return { startDate, endDate, storeId, groupBy };
};

export const validateInventoryValuationQuery = (query = {}) => {
  const storeId = parseStoreId(query);
  return { storeId };
};

export const validateProfitLossQuery = (query = {}) => {
  const { startDate, endDate } = parseDateRange(query);
  const storeId = parseStoreId(query);
  return { startDate, endDate, storeId };
};

export const validateTopProductsQuery = (query = {}) => {
  const { startDate, endDate } = parseDateRange(query);
  const storeId = parseStoreId(query);

  const sortBy =
    query.sortBy?.trim() || REPORT_DEFAULTS.DEFAULT_TOP_PRODUCTS_SORT_BY;
  if (!TOP_PRODUCTS_SORT_FIELDS.includes(sortBy)) {
    throw new ApiError(
      400,
      `sortBy must be one of: ${TOP_PRODUCTS_SORT_FIELDS.join(", ")}`,
    );
  }

  let limit = Number(query.limit || REPORT_DEFAULTS.DEFAULT_TOP_PRODUCTS_LIMIT);
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > REPORT_DEFAULTS.MAX_TOP_PRODUCTS_LIMIT
  ) {
    throw new ApiError(
      400,
      `limit must be between 1 and ${REPORT_DEFAULTS.MAX_TOP_PRODUCTS_LIMIT}`,
    );
  }
  return { startDate, endDate, storeId, sortBy, limit };
};

export const validateStoreComparisonQuery = (query = {}) => {
  const { startDate, endDate } = parseDateRange(query);
  return { startDate, endDate };
};

export const validateStaffPerformanceQuery = (query = {}) => {
  const { startDate, endDate } = parseDateRange(query);
  const storeId = parseStoreId(query);
  return { startDate, endDate, storeId };
};

export const validateExportQuery = (query = {}) => {
  const type = query.type?.trim();
  if (!type || !Object.values(REPORT_TYPES).includes(type)) {
    throw new ApiError(
      400,
      `type must be one of: ${Object.values(REPORT_TYPES).join(", ")}`,
    );
  }
  const format = query.format?.trim();
  if (!format || !REPORT_FORMATS.includes(format)) {
    throw new ApiError(
      400,
      `format must be one of: ${REPORT_FORMATS.join(", ")}`,
    );
  }
  return { type, format };
};
