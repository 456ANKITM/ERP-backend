import Category from "@/models/Category.model";
import Store, { STORE_STATUS } from "@/models/Store.model";
import { USER_ROLES } from "@/models/User.model";
import ApiError from "@/utils/ApiError";

const CATEGORY_MESSAGES = Object.freeze({
  CREATED: "Category created Successfully",
  LIST_SUCCESS: "Categories fetched successfully",
  STORE_NOT_FOUND: "Store not found or is not active",
  STORE_ID_REQUIRED: "Store Id is required",
  NAME_TAKEN: "A category With this name already exists in the store",
});

const resolveWriteStoreId = async ({ user, bodyStoreId }) => {
  if (user.role === USER_ROLES.STORE_MANAGER) {
    return user.storeId;
  }
  if (!bodyStoreId) {
    throw new ApiError(400, CATEGORY_MESSAGES.STORE_ID_REQUIRED);
  }
  const store = await Store.findOne({
    _id: bodyStoreId,
    businessId: user.businessId,
    deletedAt: null,
    status: STORE_STATUS.ACTIVE,
  });
  if (!store) {
    throw new ApiError(404, CATEGORY_MESSAGES.STORE_NOT_FOUND);
  }
  return store._id;
};

const resolveReadStoreFilter = (user, queryStoreId) => {
  if (user.role === USER_ROLES.STORE_MANAGER) {
    return user.storeId;
  }
  return queryStoreId || null;
};

export const createCategory = async ({ user, data }) => {
  const storeId = await resolveWriteStoreId({
    user,
    bodyStoreId: data.storeId,
  });
  const existing = await Category.findOne({
    businessId: user.businessId,
    storeId,
    name: data.name,
    deletedAt: null,
  });
  if (existing) {
    throw new ApiError(409, CATEGORY_MESSAGES.NAME_TAKEN);
  }

  const category = await Category.create({
    name: data.name,
    description: data.description ?? null,
    businessId: user.businessId,
    storeId,
    createdBy: user._id,
  });
  return category.toObject();
};

export const listCategories = async ({ user, query }) => {
  const storeFilter = resolveReadStoreFilter(user, query.storeId);
  const filter = {
    businessId: user.businessId,
    deletedAt: null,
  };
  if (storeFilter) filter.storeId = storeFilter;
  const categories = await Category.find(filter).sort({ name: 1 }).lean();

  return { categories };
};

export { CATEGORY_MESSAGES };
