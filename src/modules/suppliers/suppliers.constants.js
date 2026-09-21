export const SUPPLIER_MESSAGES = Object.freeze({
  CREATED: "Supplier created successfully",
  LIST_SUCCESS: "Supplier fetched successfully",
  DETAILS_SUCCESS: "Suppliers details fetched successfully",
  UPDATED: "Suppliers updated successfully",
  REMOVED: "Suppliers removed sucessfully",
  SUPPLIER_NOT_FOUND: "Supplier not found",
  ALREADY_INACTIVE: "Supplier is already inactive",
  NAME_TAKEN: "A supplier with this name already taken",
});

export const SUPPLIER_SORT_FIELDS = Object.freeze([
  "name",
  "createdAt",
  "updatedAt",
  "status",
]);

export const SUPPLIER_DEFAULTS = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_SORT_BY: "name",
  DEFAULT_SORT_ORDER: "asc",
  MAX_SEARCH_LENGTH: 100,
  PURCHASE_HISTORY_LIMIT: 50,
});
