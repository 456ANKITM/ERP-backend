export const USER_MESSAGES = Object.freeze({
  INVITED: "Invitation sent successfully",
  LIST_SUCCESS: "Staff fetched sucessfully",
  DETAILS_SUCCESS: "Staff details fetched successfully",
  UPDATED: "Staff updated successfully",
  STATUS_UPDATED: "Staff status updated successfully",
  REMOVED: "Staff member removed successfully",
  INVITE_ACCEPTED: "Invitation accepted. You can now log in.",
  USER_NOT_FOUND: "Staff member not found",
  EMAIL_TAKEN: "Unable to invite with these details",
  CANNOT_MANAGE_SELF: "You cannot perform this action on your own account",
  CANNOT_MANAGE_ROLE: "You can only manage staff members of your business",
  STORE_NOT_FOUND: "Store not found in your business",
  STORE_REQUIRED: "A store must be assigned for a store manager",
  INVALID_INVITE: "Invalid or expired invitation",
  ALREADY_HAS_STATUS: "Account already has this status",
  STILL_INVITED:
    "Cannot change status of an account that has not accepted its invite",
});

export const USER_SORT_FIELDS = Object.freeze([
    "name", 
    "email", 
    "createdAt", 
    "updatedAt", 
    "status", 
    "lastLoginAt"
]); 

export const USER_DEFAULTS = Object.freeze({
    DEFAULT_PAGE: 1, 
    DEFAULT_LIMIT: 20, 
    MAX_LIMIT: 100, 
    DEFAULT_SORT_BY:"createdAt", 
    DEFAULT_SORT_ORDER: "desc", 
    MAX_SEARCH_LENGTH: 100
})

export const MANAGEABLE_USER_STATUSES = Object.freeze([
    "ACTIVE", 
    "SUSPENDED", 
    "DISABLED"
])
