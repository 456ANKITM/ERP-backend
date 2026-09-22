export const PURCHASE_MESSAGES = Object.freeze({
  CREATED: "Purchase recorded successfully",
  LIST_SUCCESS: "Purchases fetched successfully",
  DETAILS_SUCCESS: "Purchase details fetched successfully",
  PAYMENT_METHOD: "Payment Status updated successfully",
  CANCELLED: "Purchase cancelled successfully",
  PURCHASE_NOT_FOUND: "Purchase not found",
  SUPPLIER_NOT_FOUND: "Supplier not found or is not active",
  STORE_NOT_FOUND: "Store not found or is not active",
  STORE_ID_REQUIRED: "storeId is required",
  PRODUCT_NOT_FOUND: "One or more products were not found in this store",
  ALREADY_CANCELLED: "Purchase is already cancelled",
  CANNOT_MODIFY_CANCELLED: "Cannot update payment on a cancelled purchase",
  AMOUNT_EXCEEDS_TOTAL: "Amount Paid Can not exceed the total amount",
  PARTIAL_AMOUNT_REQUIRED:
    "Amount Paid is required and must be between 0 and total amount when status is PARTIAL",
  DISCOUNT_TOO_HIGH: "Discount can not exceed subtotal plus tax",
  INSUFFICIENT_STOCK_TO_CANCEL:
    "Cannot Cancel: Current Sotck is lower than the purchased quantity for one or more items",
  NUMBER_GENERATION_FAILED:
    "Could not generate a unique purchase number, please retry",
});

export const PURCHASE_SORT_FIELDS = Object.freeze([
  "purchaseDate",
  "totalAmount",
  "paymentStatus",
  "createdAt",
]);

export const PURCHASE_DEFAULTS = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_SORT_BY: "purchaseDate",
  DEFAULT_SORT_ORDER: "desc",
  MAX_SEARCH_LENGTH: 100,
  NUMBER_GENERATION_MAX_ATTEMPTS: 5,
});
