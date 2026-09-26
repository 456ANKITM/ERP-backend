export const REPORT_MESSAGES = Object.freeze({
  SUCCESS: "Report generated successfully",
  STORE_NOT_FOUND: "Store not found in your business",
  INVALID_DATE_RANGE: "startDate must be before or equal to endDate",
  INVALID_REPORT_TYPE: "Invalid report type",
  INVALID_FORMAT: "format must be either pdf or xlsx",
  FORBIDDEN_REPORT_FOR_ROLE: "You do not have permission to export this report",
});

export const REPORT_TYPES = Object.freeze({
  SALES_SUMMARY: "sales-summary",
  INVENTORY_VALUATION: "inventory-valuation",
  PROFIT_LOSS: "profit-loss",
  TOP_PRODUCTS: "top-products",
  STORE_COMPARISON: "store-comparison",
  STAFF_PERFORMANCE: "staff-performance",
});

export const OWNER_ONLY_REPORT_TYPES = new Set([
  REPORT_TYPES.PROFIT_LOSS,
  REPORT_TYPES.STORE_COMPARISON,
  REPORT_TYPES.STAFF_PERFORMANCE,
]);

export const REPORT_FORMATS = Object.freeze(["pdf", "xlsx"]);
export const REPORT_GROUP_BY = Object.freeze(["day", "week", "month"]);
export const TOP_PRODUCTS_SORT_FIELDS = Object.freeze(["revenue", "quantity"]);

export const REPORT_DEFAULTS = Object.freeze({
  DEFAULT_RANGE_DAYS: 30,
  DEFAULT_GROUP_BY: "day",
  DEFAULT_TOP_PRODUCTS_SORT_BY: "revenue",
  DEFAULT_TOP_PRODUCTS_LIMIT: 10,
  MAX_TOP_PRODUCTS_LIMIT: 50,
});
