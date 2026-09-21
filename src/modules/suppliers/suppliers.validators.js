import { SUPPLIER_STATUS } from "@/models/Supplier.model";
import ApiError from "@/utils/ApiError";
import mongoose from "mongoose";
import { SUPPLIER_DEFAULTS, SUPPLIER_SORT_FIELDS } from "./suppliers.constants";

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

export const createSupplierSchema = (body = {}) => {
  const errors = {};
  if (typeof body.name !== "string" || body.name.trim().length < 2) {
    errors.name = "Supplier name must be at least 2 characters";
  }
  if (body.contactPerson !== undefined && body.contactPerson !== null) {
    if (typeof body.contactPerson !== "string") {
      errors.contactPerson = "Contact Person must be an string";
    }
  }

  if (body.phone !== undefined && body.phone !== null) {
    if (typeof body.phone !== "string" || body.phone.trim().length > 20) {
      errors.phone = "Phone must be a string of at most 20 characters";
    }
  }

  if (body.email !== undefined && body.email !== null && body.email !== "") {
    if (typeof body.email !== "string" || !isValidEmail(body.email)) {
      errors.email = "Valid Email is required";
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
      ...(body.contactPerson
        ? { contactPerson: body.contactPerson.trim() }
        : {}),
      ...(body.phone ? { phone: body.phone.trim() } : {}),
      ...(body.email ? { email: body.email.trim().toLowerCase() } : {}),
      ...(address !== undefined ? { address } : {}),
    },
  };
};

export const updateSupplierSchema = (body = {}) => {
  const errors = {};
  const data = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 2) {
      errors.name = "Supplier name must be at least 2 characters";
    } else {
      data.name = body.name.trim();
    }
  }

  if (body.contactPerson !== undefined) {
    if (body.contactPerson === null || body.contactPerson === "") {
      data.contactPerson = null;
    } else if (typeof body.contactPerson !== "string") {
      errors.contactPerson = "Contact Person must be an string";
    } else {
      data.contactPerson = body.contactPerson.trim();
    }
  }

  if (body.phone !== undefined) {
    if (body.phone === null || body.phone === "") {
      data.phone = null;
    } else if (
      typeof body.phone !== "string" ||
      body.phone.trim().length > 20
    ) {
      errors.phone = "Phone number must be 20 characters string";
    } else {
      data.phone = body.phone.trim();
    }
  }

  if (body.email !== undefined) {
    if (body.email === null || body.emial === "") {
      data.email = null;
    } else if (typeof body.email !== "string" || !isValidEmail(body.email)) {
      errors.email = "Valid email is required";
    } else {
      data.email = body.email.trim().toLowerCase();
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

export const validateSupplierId = (supplierId) => {
  if (!mongoose.isValidObjectId(supplierId)) {
    throw new ApiError(400, "Invalid Supplier Id");
  }
  return supplierId;
};

export const validateListSuppliersQuerry = (query = {}) => {
  const page = Number(query.page || SUPPLIER_DEFAULTS.DEFAULT_PAGE);
  const limit = Number(query.limit || SUPPLIER_DEFAULTS.DEFAULT_LIMIT);

  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(400, "Page must be a positive integer");
  }

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > SUPPLIER_DEFAULTS.MAX_LIMIT
  ) {
    throw new ApiError(
      400,
      `Limit must be between 1 and ${SUPPLIER_DEFAULTS.MAX_LIMIT}`,
    );
  }
  const status = query.status?.trim();
  if (status && !Object.values(SUPPLIER_STATUS).includes(status)) {
    throw new ApiError(400, "Invalid Supplier Status");
  }
  const search = query.search?.trim();
  if (search && search.length > SUPPLIER_DEFAULTS.MAX_SEARCH_LENGTH) {
    throw new ApiError(
      400,
      `Search can not exceed ${SUPPLIER_DEFAULTS.MAX_SEARCH_LENGTH}`,
    );
  }

  const sortBy = query.sortBy?.trim() || SUPPLIER_DEFAULTS.DEFAULT_SORT_BY;
  if (!SUPPLIER_SORT_FIELDS.includes(sortBy)) {
    throw new ApiError(
      400,
      `Invalid Sort field, Allowed fields: ${SUPPLIER_SORT_FIELDS.join(", ")}`,
    );
  }

  const sortOrder =
    query.sortOrder?.trim().toLowerCase() ||
    SUPPLIER_DEFAULTS.DEFAULT_SORT_ORDER;
  if (!["asc", "desc"].includes(sortOrder)) {
    throw new ApiError(400, "Sort Order must be ascending or descending");
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
