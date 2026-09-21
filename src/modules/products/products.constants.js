export const PRODUCT_MESSAGES = Object.freeze({
  CREATED: "Product created Successfully",
  LIST_SUCCESS: "Products fetched successfully",
  DETAILS_SUCCESS: "Products detailled fetched successfully",
  UPDATED: "Product updated successfully",
  DEACTIVATED: "Product deactivated successfully",
  STOCK_ADJUSTED: "Stock adjusted successfully",
  LOW_STOCK_SUCCESS: "Low Stock products fetched successfully",
  PRODUCT_NOT_FOUND: "Product not found",
  STORE_NOT_FOUND: "Store not found",
  CATEGORY_NOT_FOUND: "Category not found",
  CATEGORY_INVALID_SCOPE: "Category does not belong to this store",
  SKU_TAKEN: "A product with this SKU already exists in the store",
  BARCODE_TAKEN: "A product with this barcode already exists in the store",
  ALREADY_INACTIVE: "Product is already deactivated",
  STORE_ID_REQUIRED: "Store ID is required",
  NO_QUANTITY_CHANGE: "Quantity Change must be a non-zero number",
  NEGATIVE_STOCK: "Adjustment would result in negative stock",
});

export const PRODUCT_SORT_FIELDS = Object.freeze([
  "name",
  "sku",
  "quantityInStock",
  "costPrice",
  "sellingPrice",
  "createdAt",
  "updatedAt",
]);

export const STOCK_STATUS_FILTERS = Object.freeze(["LOW", "OUT", "NORMAL"]);

export const PRODUCT_DEFAULTS = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_SORT_BY: "createdAt",
  DEFAULT_SORT_ORDER: "desc",
  MAX_SEARCH_LENGTH: 100,
  STOCK_HISTORY_LIMIT: 50,
});
