export const CUSTOMER_MESSAGES = Object.freeze({
  CREATED: "Customer Created Successfully",
  LIST_SUCCESS: "Customers fetched successfully",
  DETAILS_SUCCESS: "Customer details fetched successfully",
  UPDATED: "Customer Updated successfully",
  CUSTOMER_NOT_FOUND: "Customer not found",
  STORE_NOT_FOUND: "Store not found or is not active",
  STORE_ID_REQUIRED: "storeId is required",
  PHONE_TAKEN: "A customer with this phone number already exists in the store",
  EMAIL_TAKEN: "A customer with this email already exists in the store",
});

export const CUSTOMER_SORT_FIELDS = Object.freeze([
  "name",
  "createdAt",
  "updatedAt",
  "loyaltyPoints",
]);

export const CUSTOMER_DEFAULTS = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_SORT_BY: "createdAt",
  DEFAULT_SORT_ORDER: "desc",
  MAX_SEARCH_LENGTH: 100,
  PURCHASE_HISTORY_LIMIT: 50,
});
