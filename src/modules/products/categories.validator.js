import ApiError from "@/utils/ApiError";
import mongoose from "mongoose";

export const createCategorySchema = (body = {}) => {
  const errors = {};
  if (typeof body.name !== "string" || body.name.trim().length < 2) {
    errors.name = "Category name must be at least 2 characters";
  }
  if (body.storeId !== null && !mongoose.isValidObjectId(body.storeId)) {
    errors.storeId = "Invalid Store Id";
  }
  if (
    body.description !== undefined &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    errors.description = "Description must be a string";
  }
  return Object.keys(errors).length
    ? { success: false, errors }
    : {
        success: true,
        data: {
          name: body.name.trim(),
          ...(body.storeId ? { storeId: body.storeId } : {}),
          ...(body.description ? { description: body.description.trim() } : {}),
        },
      };
};

export const validateListCategoriesQuery = (query = {}) => {
  const storeId = query.storeId?.trim();
  if (storeId && !mongoose.isValidObjectId(storeId)) {
    throw new ApiError(400, "Invalid Store Id");
  }
  return { storeId: storeId || null };
};
