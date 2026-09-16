import mongoose from "mongoose";
import { USER_STATUS } from "@/models/User.model.js";
import ApiError from "@/utils/ApiError.js";
import {
  USER_SORT_FIELDS,
  USER_DEFAULTS,
  MANAGEABLE_USER_STATUSES,
} from "./users.constants.js";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isStrongPassword = (password) =>
  typeof password === "string" &&
  password.length >= 8 &&
  password.length <= 128 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /\d/.test(password);

export const inviteUserSchema = (body = {}) => {
  const errors = {};
  if (typeof body.name !== "string" || body.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  }
  if (typeof body.email !== "string" || !isValidEmail(body.email)) {
    errors.email = "Valid email is required";
  }
  if (!mongoose.isValidObjectId(body.storeId)) {
    errors.storeId = "A valid store Id is required";
  }
  if (body.phone !== undefined && body.phone !== null && body.phone !== "") {
    if (typeof body.phone !== "string" || body.phone.trim().length > 10) {
      errors.phone = "Phone must be a string of at most 10 characters";
    }
  }

  return Object.keys(errors).length
    ? { success: false, errors }
    : {
        success: true,
        data: {
          name: body.name.trim(),
          email: body.email.trim().toLowerCase(),
          storeId: body.storeId,
          ...(body.phone ? { phone: body.phone.trim() } : {}),
        },
      };
};

export const updateUserSchema = (body = {}) => {
  const errors = {};
  const data = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else {
      data.name = body.name.trim();
    }
  }

  if (body.phone !== undefined) {
    if (body.phone === null || body.phone === "") {
      data.phone = null;
    } else if (
      typeof body.phone !== "string" ||
      body.phone.trim().length > 10
    ) {
      errors.phone = "Phone must be a string of at most 10 characters";
    } else {
      data.phone = body.phone.trim();
    }
  }

  if (body.storeId !== undefined) {
    if (!mongoose.isValidObjectId(body.storeId)) {
      errors.storeId = "A valid storeId is required";
    } else {
      data.storeId = body.storeId;
    }
  }

  if (Object.keys(errors).length) {
    return { success: false, errors };
  }

  if (Object.keys(data).length === 0) {
    return {
      success: false,
      errors: { body: "At least one field must be provided to update" },
    };
  }

  return { success: true, data };
};

export const updateUserStatusSchema = (body = {}) => {
  const keys = Object.keys(body || {});
  if (keys.length !== 1 || keys[0] !== "status") {
    return {
      success: false,
      errors: { status: "Only the status field is allowed" },
    };
  }

  if (
    typeof body.status !== "string" ||
    !MANAGEABLE_USER_STATUSES.includes(body.status)
  ) {
    return {
      success: false,
      errors: {
        status: `Status must be one of: ${MANAGEABLE_USER_STATUSES.join(", ")}`,
      },
    };
  }

  return { success: true, data: { status: body.status } };
};

export const acceptInviteSchema = (body = {}) => {
  const errors = {};
  if (typeof body.token !== "string" || body.token.length < 20) {
    errors.token = "Valid invitation token is required";
  }
  if (!isStrongPassword(body.password)) {
    errors.password =
      "Password must be 8-128 characters and contain uppercase, lowercase and a number";
  }
  return Object.keys(errors).length
    ? { success: false, errors }
    : { success: true, data: { token: body.token, password: body.password } };
};

export const validateUserId = (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }
  return userId;
};

export const validateListUsersQuery = (query = {}) => {
  const page = Number(query.page || USER_DEFAULTS.DEFAULT_PAGE);
  const limit = Number(query.limit || USER_DEFAULTS.DEFAULT_LIMIT);
  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(400, "Page must be a positive integer");
  }
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > USER_DEFAULTS.MAX_LIMIT
  ) {
    throw new ApiError(
      400,
      `Limit must be between 1 and ${USER_DEFAULTS.MAX_LIMIT}`,
    );
  }
  const status = query.status?.trim();
  if (status && !Object.values(USER_STATUS).includes(status)) {
    throw new ApiError(400, "Invalid user status");
  }
  const storeId = query.storeId?.trim();

  if (storeId && !mongoose.isValidObjectId(storeId)) {
    throw new ApiError(400, "Invalid store ID");
  }
  const search = query.search?.trim();
  if (search && search.length > USER_DEFAULTS.MAX_SEARCH_LENGTH) {
    throw new ApiError(
      400,
      `Search cannot exceed ${USER_DEFAULTS.MAX_SEARCH_LENGTH} characters`,
    );
  }
  const sortBy = query.sortBy?.trim() || USER_DEFAULTS.DEFAULT_SORT_BY;
  if (!USER_SORT_FIELDS.includes(sortBy)) {
    throw new ApiError(
      400,
      `Invalid sort field. Allowed fields: ${USER_SORT_FIELDS.join(", ")}`,
    );
  }
  const sortOrder =
    query.sortOrder?.trim().toLowerCase() || USER_DEFAULTS.DEFAULT_SORT_ORDER;
  if (!["asc", "desc"].includes(sortOrder)) {
    throw new ApiError(400, "Sort order must be either asc or desc");
  }
  return {
    page,
    limit,
    status: status || null,
    storeId: storeId || null,
    search: search || null,
    sortBy,
    sortOrder,
  };
};
