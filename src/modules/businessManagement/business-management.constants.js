// This Module Contains constants used specifically by the super admin businesss Management APIs

export const BUSINESS_MANAGEMENT = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_SORT_BY: "createdAt",
  DEFAULT_SORT_ORDER: "desc",
  MAX_SEARCH_LENGTH: 100,
});

export const BUSINESS_MANAGEMENT_SORT_FIELDS = Object.freeze([
  "name",
  "createdAt",
  "updatedAt",
  "status",
  "subscriptionPlan",
]);

// statuses that a super admin is allowed to explicitly set through PATCH /businesses/:id/status, cancelled is intentionally executed, A Cancelled business should not be reactivated through normal status endpoint

export const MANAGEABLE_BUSINESS_STATUSES = Object.freeze([
  "TRIAL",
  "ACTIVE",
  "SUSPENDED",
]);

export const BUSINESS_MANAGEMENT_MESSAGES = Object.freeze({
  LIST_SUCCESS: "Business fetched successfully",
  DETAILS_SUCCESS: "Business Details fetched successfully",
  STATUS_UPDATED: "Business status updated successfully",
  ANALYTICS_SUCCESS: "Business analytics fetched successfully",
  DELETED: "Business deactivated sucessfully",
  BUSINESS_NOT_FOUND: "Business not found",
  INVALID_BUSINESS_ID: "Invalid Business ID",
  INVALID_STATUS: "Invalid Business Status",
  CANCELLED_BUSINESS: "Cancelled Business Can not me modified",
});
