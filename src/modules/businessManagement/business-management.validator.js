import mongoose from "mongoose";

import Business from "@/models/Business.model.js";
import ApiError from "@/utils/ApiError.js";

import {
  BUSINESS_MANAGEMENT,
  BUSINESS_MANAGEMENT_SORT_FIELDS,
  MANAGEABLE_BUSINESS_STATUSES,
} from "./business-management.constants.js";

export const validateBusinessId = (businessId) => {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new ApiError(400, "Invalid business ID");
  }

  return businessId;
};

export const validateListBusinessesQuery = (query = {}) => {
  const page = Number(
    query.page || BUSINESS_MANAGEMENT.DEFAULT_PAGE,
  );

  const limit = Number(
    query.limit || BUSINESS_MANAGEMENT.DEFAULT_LIMIT,
  );

  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(
      400,
      "Page must be a positive integer",
    );
  }

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > BUSINESS_MANAGEMENT.MAX_LIMIT
  ) {
    throw new ApiError(
      400,
      `Limit must be between 1 and ${BUSINESS_MANAGEMENT.MAX_LIMIT}`,
    );
  }

  const status = query.status?.trim();

  if (
    status &&
    !Object.values(Business.STATUS).includes(status)
  ) {
    throw new ApiError(
      400,
      "Invalid business status",
    );
  }

  const search = query.search?.trim();

  if (
    search &&
    search.length > BUSINESS_MANAGEMENT.MAX_SEARCH_LENGTH
  ) {
    throw new ApiError(
      400,
      `Search cannot exceed ${BUSINESS_MANAGEMENT.MAX_SEARCH_LENGTH} characters`,
    );
  }

  const sortBy =
    query.sortBy?.trim() ||
    BUSINESS_MANAGEMENT.DEFAULT_SORT_BY;

  if (!BUSINESS_MANAGEMENT_SORT_FIELDS.includes(sortBy)) {
    throw new ApiError(
      400,
      `Invalid sort field. Allowed fields: ${BUSINESS_MANAGEMENT_SORT_FIELDS.join(
        ", ",
      )}`,
    );
  }

  const sortOrder =
    query.sortOrder?.trim().toLowerCase() ||
    BUSINESS_MANAGEMENT.DEFAULT_SORT_ORDER;

  if (!["asc", "desc"].includes(sortOrder)) {
    throw new ApiError(
      400,
      "Sort order must be either asc or desc",
    );
  }

  return {
    page,
    limit,
    status: status || null,
    search: search || null,
    sortBy,
    sortOrder,
  };
};

export const validateBusinessStatusBody = (body = {}) => {
  if (
    body === null ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    throw new ApiError(
      400,
      "Request body must be an object",
    );
  }

  const keys = Object.keys(body);

  if (keys.length !== 1 || keys[0] !== "status") {
    throw new ApiError(
      400,
      "Only the status field is allowed",
    );
  }

  if (
    typeof body.status !== "string" ||
    !MANAGEABLE_BUSINESS_STATUSES.includes(body.status)
  ) {
    throw new ApiError(
      400,
      "Invalid business status",
    );
  }

  return {
    status: body.status,
  };
};