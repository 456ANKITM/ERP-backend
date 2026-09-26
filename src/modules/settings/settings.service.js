import Business from "@/models/Business.model.js";
import Store from "@/models/Store.model.js";
import { USER_ROLES } from "@/models/User.model.js";

import ApiError from "@/utils/ApiError.js";

import { SETTINGS_MESSAGES } from "./settings.constants.js";
import { validateStoreId } from "./settings.validator.js";

const BUSINESS_SETTINGS_FIELDS =
  "name slug logo currency taxRate taxNumber contactEmail contactPhone timezone fiscalYearStart subscriptionPlan status createdAt updatedAt";

export const getBusinessSettings = async ({ user }) => {
  const business = await Business.findOne({
    _id: user.businessId,
    deletedAt: null,
  })
    .select(BUSINESS_SETTINGS_FIELDS)
    .lean();

  if (!business) {
    throw new ApiError(404, SETTINGS_MESSAGES.BUSINESS_NOT_FOUND);
  }

  return { business };
};

export const updateBusinessSettings = async ({ user, data }) => {
  const business = await Business.findOne({
    _id: user.businessId,
    deletedAt: null,
  });

  if (!business) {
    throw new ApiError(404, SETTINGS_MESSAGES.BUSINESS_NOT_FOUND);
  }

  Object.assign(business, data);
  business.updatedBy = user._id;

  await business.save();

  const { _id, name, slug, logo, currency, taxRate, taxNumber, contactEmail, contactPhone, timezone, fiscalYearStart, subscriptionPlan, status, createdAt, updatedAt } =
    business.toObject();

  return {
    business: { _id, name, slug, logo, currency, taxRate, taxNumber, contactEmail, contactPhone, timezone, fiscalYearStart, subscriptionPlan, status, createdAt, updatedAt },
  };
};

export const updateStoreSettings = async ({ user, storeId, data }) => {
  validateStoreId(storeId);

  // A Store Manager may only ever touch their own store's settings —
  // checked before the lookup so a Store Manager probing another
  // store's ID gets a clear 403, not a 404 that leaks existence.
  if (user.role === USER_ROLES.STORE_MANAGER && String(storeId) !== String(user.storeId)) {
    throw new ApiError(403, SETTINGS_MESSAGES.FORBIDDEN_STORE);
  }

  const store = await Store.findOne({
    _id: storeId,
    businessId: user.businessId,
    deletedAt: null,
  });

  if (!store) {
    throw new ApiError(404, SETTINGS_MESSAGES.STORE_NOT_FOUND);
  }

  store.settings = {
    ...(store.settings?.toObject ? store.settings.toObject() : store.settings),
    ...data,
  };
  store.updatedBy = user._id;

  await store.save();

  return { store: store.toObject() };
};