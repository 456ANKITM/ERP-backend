import { CUSTOMER_STATUS } from "@/models/Customer.model";
import ApiError from "@/utils/ApiError";
import mongoose from "mongoose";
import { CUSTOMER_DEFAULTS, CUSTOMER_SORT_FIELDS } from "./customers.constants";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateAddress = (address, errors) => {
  if (address === undefined) return undefined;
  if (
    typeof address !== "object" ||
    address === null ||
    Array.isArray(address)
  ) {
    errors.address = "Address must be an object";
    return undefined;
  }
  const { street, city, state, country, postalCode } = address;
  const result = {};

  if (street !== undefined)
    result.street = street === null ? null : String(street).trim();
  if (city !== undefined)
    result.city = city === null ? null : String(city).trim();
  if (state !== undefined)
    result.state = state === null ? null : String(state).trim();
  if (country !== undefined)
    result.country = country === null ? null : String(country).trim();
  if (postalCode !== undefined)
    result.postalCode = postalCode === null ? null : String(postalCode).trim();

  return result;
};

export const createCustomerSchema = (body = {}) => {
  const errors = {};
  if (typeof body.name !== "string" || body.name.trim().length < 2) {
    errors.name = "Customer name should be at least 2 characters";
  }
  if (body.storeId !== undefined && !mongoose.isValidObjectId(body.storeId)) {
    errors.storeId = "Invalid Store Id";
  }
  if (body.phone !== undefined && body.phone !== null && body.name !== "") {
    if (typeof body.phone !== "string" || body.phone.trim().length > 20) {
      errors.phone = "Phone must be a string of most 20 characters";
    }
  }
  if (body.email !== undefined && body.email !== null && body.email !== "") {
    if (typeof body.email !== "string" || !isValidEmail(body.email)) {
      errors.email = "Valid email is required";
    }
  }

  const address = validateAddress(body.address, errors);
  if (Object.keys(errors).length) {
    return { success: false, errors };
  }
  return {
    success: true,
    data: {
      name: body.name.trim(),
      ...(body.storeId ? { storeId: body.storeId } : {}),
      ...(body.phone ? { phone: body.phone.trim() } : {}),
      ...(body.email ? { email: body.email.trim().toLowerCase() } : {}),
      ...(address !== undefined ? { address } : {}),
    },
  };
};

export const updateCustomerSchema = (body = {}) => {
  const errors = {};
  const data = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 2) {
      errors.name = "Customer name must be at least 2 characters";
    } else {
      data.name = body.name.trim();
    }
  }

  if (body.phone !== undefined) {
    if (body.phone === null || body.phone === "") {
      data.phone = null;
    } else if (
      typeof body.phone !== "string" ||
      body.phone.trim().length > 20
    ) {
      errors.phone = "Phone must be a string of at most 20 characters";
    } else {
      data.phone = body.phone.trim();
    }
  }

  if (body.email !== undefined) {
    if (body.email === null || body.email === "") {
      data.email = null;
    } else if (typeof body.email !== "string" || !isValidEmail(body.email)) {
      errors.email = "Valid email is required";
    } else {
      data.email = body.email.trim().toLowerCase();
    }
  }

  if (body.status !== undefined) {
    if (!Object.values(CUSTOMER_STATUS).includes(body.status)) {
      errors.status = `status must be one of: ${Object.values(CUSTOMER_STATUS).join(", ")}`;
    } else {
      data.status = body.status;
    }
  }

  const address = validateAddress(body.address, errors);

  if (address !== undefined) data.address = address;
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

export const validateCustomerId = (customerId) => {
  if (!mongoose.isValidObjectId(customerId)) {
    throw new ApiError(400, "Invalid customer ID");
  }
  return customerId;
};

export const validateListCustomersQuery = (query = {}) => {
  const page = Number(query.page || CUSTOMER_DEFAULTS.DEFAULT_PAGE);
  const limit = Number(query.limit || CUSTOMER_DEFAULTS.DEFAULT_LIMIT);

  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(400, "Page must be a positive integer");
  }
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > CUSTOMER_DEFAULTS.MAX_LIMIT
  ) {
    throw new ApiError(
      400,
      `Limit must be between 1 and ${CUSTOMER_DEFAULTS.MAX_LIMIT}`,
    );
  }
  const status = query.status?.trim();
  if (status && !Object.values(CUSTOMER_STATUS).includes(status)) {
    throw new ApiError(400, "Invalid customer status");
  }

  const storeId = query.storeId?.trim();
  if (storeId && !mongoose.isValidObjectId(storeId)) {
    throw new ApiError(400, "Invalid store ID");
  }
  const search = query.search?.trim();
  if (search && search.length > CUSTOMER_DEFAULTS.MAX_SEARCH_LENGTH) {
    throw new ApiError(
      400,
      `Search cannot exceed ${CUSTOMER_DEFAULTS.MAX_SEARCH_LENGTH} characters`,
    );
  }
  const sortBy = query.sortBy?.trim() || CUSTOMER_DEFAULTS.DEFAULT_SORT_BY;
  if (!CUSTOMER_SORT_FIELDS.includes(sortBy)) {
    throw new ApiError(
      400,
      `Invalid sort field. Allowed fields: ${CUSTOMER_SORT_FIELDS.join(", ")}`,
    );
  }
  const sortOrder =
    query.sortOrder?.trim().toLowerCase() ||
    CUSTOMER_DEFAULTS.DEFAULT_SORT_ORDER;
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
