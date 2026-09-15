export const STORE_MESSAGES = Object.freeze({
  CREATED: "Store Created Successfully",
  LIST_SUCCESS: "Stores fetched Sucessfully",
  DETAILS_SUCCESS: "Store details fetched successfully",
  UPDATED: "Store updated successfully",
  DEACTIVATED: "Store deactivated successfully",
  MANAGER_ASSIGNED: "Store Manager assigned successfully",
  STORE_NOT_FOUND: "Store not found",
  CODE_TAKEN: "Store code is already in use for this business",
  ALREADY_INACTIVE: "Store is already deactivated",
  MANAGER_NOT_FOUND: "Store Manager user is not found",
  MANAGER_INVALID_ROLE: "User must have the STORE_MANAGER role to be assigned",
  MANAGER_NOT_ACTIVE: "Store manager account is not active",
});

// This is used in the Get API When we get lots of store on which basis we need to sort the result, Its used in that
export const STORE_SORT_FIELDS = Object.freeze([
  "name",
  "code",
  "createdAt",
  "updatedAt",
  "status",
]);

// These are the defaults when we get the stores like if we do not provide any sort by then it will be sort by with createdAt and like that.
export const STORE_DEFAULTS = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_SORT_BY: "createdAt",
  DEFAULT_SORT_ORDER: "desc",
});
