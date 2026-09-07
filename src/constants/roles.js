// It act as a single source of truth for user roles in our RBAC module 

const ROLES = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  OWNER: 'OWNER',
  STORE_MANAGER: 'STORE_MANAGER',
});

const ALL_ROLES = Object.values(ROLES);

export { ROLES, ALL_ROLES };