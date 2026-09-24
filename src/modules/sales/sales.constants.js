export const SALE_MESSAGES = Object.freeze({
  CREATED: "Sale recorded successfully",
  LIST_SUCCESS: "Sales fetched successfully",
  DETAILS_SUCCESS: "Sale details fetched successfully",
  REFUNDED: "Refunded processed successfully",
  SALE_NOT_FOUND: "Sale not found",
  STORE_NOT_FOUND: "Store not found or is not active",
  STORE_ID_REQUIRED: "storeId is required",
  CUSTOMER_NOT_FOUND: "Customer not found in the store",
  PRODUCT_NOT_FOUND: "One or more products were not found in the store",
  DUPLICATE_PRODUCT_IN_ITEMS:
    "Each Product Can only appear once per sale - combine quantities instead",
  INSUFFICIENT_STOCK: "Insufficient stock for one or more items",
  DISCOUNT_TOO_HIGH: "Discount can not exccede sub total plus tax",
  AMOUNT_EXCCEDS_TOTAL: "amountPaid can not exceede the total amount",
  ALREADY_FULLY_REFUNDED: "This sale has already been fully refunded",
  REFUND_ITEM_NOT_IN_SALE: "One or more items are not part of this sale",
  REFUND_QUANTITY_EXCEEDS_REMAINING:
    "Refund quantity exceeds the remaining refundable quantity for one or more items",
  NUMBER_GENERATION_FAILED:
    "Could not generate a unique invoice number, please retry",
});

export const SALE_SORT_FIELDS = Object.freeze([
  "createdAt",
  "totalAmount",
  "paymentStatus",
]);

export const SALE_DEFAULTS = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_SORT_BY: "createdAt",
  DEFAULT_SORT_ORDER: "desc",
  MAX_SEARCH_LENGTH: 100,
  NUMBER_GENERATION_MAX_ATTEMPTS: 5,
});
