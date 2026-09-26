import asyncHandler from "@/utils/asyncHandler.js";

import {
  getSalesSummary,
  getInventoryValuation,
  getProfitLoss,
  getTopProducts,
  getStoreComparison,
  getStaffPerformance,
} from "./reports.service.js";

import { validateExportQuery } from "./reports.validator.js";
import { REPORT_MESSAGES, REPORT_TYPES, OWNER_ONLY_REPORT_TYPES } from "./reports.constants.js";
import { ROLES } from "@/constants/roles.js";
import ApiError from "@/utils/ApiError.js";
import { toReportTable, streamReportPdf, streamReportXlsx } from "@/utils/reportExport.js";

const REPORT_HANDLERS = {
  [REPORT_TYPES.SALES_SUMMARY]: getSalesSummary,
  [REPORT_TYPES.INVENTORY_VALUATION]: getInventoryValuation,
  [REPORT_TYPES.PROFIT_LOSS]: getProfitLoss,
  [REPORT_TYPES.TOP_PRODUCTS]: getTopProducts,
  [REPORT_TYPES.STORE_COMPARISON]: getStoreComparison,
  [REPORT_TYPES.STAFF_PERFORMANCE]: getStaffPerformance,
};

export const salesSummaryController = asyncHandler(async (req, res) => {
  const data = await getSalesSummary({ user: req.user, query: req.query });
  res.status(200).json({ success: true, message: REPORT_MESSAGES.SUCCESS, data });
});

export const inventoryValuationController = asyncHandler(async (req, res) => {
  const data = await getInventoryValuation({ user: req.user, query: req.query });
  res.status(200).json({ success: true, message: REPORT_MESSAGES.SUCCESS, data });
});

export const profitLossController = asyncHandler(async (req, res) => {
  const data = await getProfitLoss({ user: req.user, query: req.query });
  res.status(200).json({ success: true, message: REPORT_MESSAGES.SUCCESS, data });
});

export const topProductsController = asyncHandler(async (req, res) => {
  const data = await getTopProducts({ user: req.user, query: req.query });
  res.status(200).json({ success: true, message: REPORT_MESSAGES.SUCCESS, data });
});

export const storeComparisonController = asyncHandler(async (req, res) => {
  const data = await getStoreComparison({ user: req.user, query: req.query });
  res.status(200).json({ success: true, message: REPORT_MESSAGES.SUCCESS, data });
});

export const staffPerformanceController = asyncHandler(async (req, res) => {
  const data = await getStaffPerformance({ user: req.user, query: req.query });
  res.status(200).json({ success: true, message: REPORT_MESSAGES.SUCCESS, data });
});

export const exportReportController = asyncHandler(async (req, res) => {
  const { type, format } = validateExportQuery(req.query);

  if (OWNER_ONLY_REPORT_TYPES.has(type) && req.user.role !== ROLES.OWNER) {
    throw new ApiError(403, REPORT_MESSAGES.FORBIDDEN_REPORT_FOR_ROLE);
  }

  const data = await REPORT_HANDLERS[type]({ user: req.user, query: req.query });
  const table = toReportTable(type, data);

  if (format === "pdf") {
    streamReportPdf({ res, table });
  } else {
    await streamReportXlsx({ res, table });
  }
});