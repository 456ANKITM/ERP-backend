import mongoose from "mongoose";
import Store from "@/models/Store.model.js";
import ApiError from "@/utils/ApiError.js";
import { STORE_DEFAULTS, STORE_SORT_FIELDS } from "./stores.constants.js";

// These are the validation layer for the store APIs, It checks incoming store data, cleans/normalizes it, validates  IDs and query parameter and returns structured data or errors

//  isValidEmail and isValidTimeString are the function that will return true or false for certain email and date data
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidTimeString = (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const validateOpeningHours = (openingHours, errors) => {
  if (openingHours === undefined) return undefined;
  if (
    typeof openingHours !== "object" ||
    openingHours === null ||
    Array.isArray(openingHours)
  ) {
    errors.openingHours = "Opening hours must be an object";
    return undefined;
  }

  const result = {};

  for (const day of DAYS) {
    const entry = openingHours[day];
    if (entry === undefined) continue;

    if (typeof entry !== "object" || entry === null) {
      errors.openingHours = `Invalid opening hours for ${day}`;
      continue;
    }
    const { open, close } = entry;

    if (open !== undefined && open !== null && !isValidTimeString(open)) {
      errors.openingHours = `${day} open time must be in HH:mm format`;
      continue;
    }

    if (close !== undefined && close !== null && !isValidTimeString(close)) {
      errors.openingHours = `${day} close time must be in HH:mm format`;
      continue;
    }

    result[day] = { open: open ?? null, close: close ?? null };
  }
  return result;
};

const validateLocation = (location, errors) => {
  if (location === undefined) return undefined;
  if (
    typeof location !== "object" ||
    location === null ||
    Array.isArray(location)
  ) {
    errors.location = "Location must be an object";
    return undefined;
  }
  const { address, city, state, country, postalCode, coordinates } = location;
  const result = {};
  if (address !== undefined) result.address = String(address).trim();
  if (city !== undefined) result.city = String(city).trim();
  if (state !== undefined) result.state = String(state).trim();
  if (country !== undefined) result.country = String(country).trim();
  if (postalCode !== undefined) result.postalCode = String(postalCode).trim();
  if (coordinates !== undefined) {
    const valid =
      coordinates &&
      coordinates.type === "Point" &&
      coordinates.coordinates.length === 2 &&
      coordinates.coordinates.every((n) => typeof n === "number");

    if (!valid) {
      errors.location =
        "Coordinates must be a GeoJSON Point: { type: 'Point', coordinates: [lng, lat] }";
    } else {
      result.coordinates = coordinates;
    }
  }
  return result;
};

export const createStoreSchema = (body = {}) => {
  const errors = {};
  if (typeof body.name !== "string" || body.name.trim().length < 2) {
    errors.name = "Store name must be at least 2 characters";
  }
  if (
    typeof body.code !== "string" ||
    !/^[A-Za-z0-9_-]{2,30}$/.test(body.code.trim())
  ) {
    errors.code =
      "Store Code must be 2-30 characters (letters, numbers, hypens, underscores)";
  }

  if (
    body.contactPhone !== undefined &&
    typeof body.contactPhone !== "string"
  ) {
    errors.contactPhone = "Contact Phone must be a string";
  }

  if (body.email !== undefined && body.email !== null && body.email !== "") {
    if (typeof body.email !== "string" || !isValidEmail(body.email)) {
      errors.email = "Valid email is  required";
    }
  }

  const location = validateLocation(body.location, errors);
  const openingHours = validateOpeningHours(body.openingHours, errors);

  if (Object.keys(errors).length) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name: body.name.trim(),
      code: body.code.trim().toUpperCase(),
      ...(location !== undefined ? { location } : {}),
      ...(body.contactPhone !== undefined
        ? { contactPhone: body.contactPhone.trim() }
        : {}),
      ...(body.email ? { email: body.email.trim().toLowerCase() } : {}),
      ...(openingHours !== undefined ? { openingHours } : {}),
    },
  };
};

export const updateStoreSchema = (body = {}) => {
  const errors = {};
  const data = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 2) {
      errors.name = "Store name must be at least 2 characters";
    } else {
      data.name = body.name.trim();
    }
  }

  if (body.contactPhone !== undefined) {
    if (typeof body.contactPhone !== "string") {
      errors.contactPhone = "Contact phone must be a string";
    } else {
      data.contactPhone = body.contactPhone.trim();
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

  const location = validateLocation(body.location, errors);
  if (location !== undefined) data.location = location;

  const openingHours = validateOpeningHours(body.openingHours, errors);
  if (openingHours !== undefined) data.openingHours = openingHours;

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

export const assignManagerSchema = (body = {}) => {
  const errors = {};
  if (!mongoose.isValidObjectId(body.userId)) {
    errors.userId = "A valid userId is required";
  }
  return Object.keys(errors).length
    ? { success: false, errors }
    : { success: true, data: { userId: body.userId } };
};

export const validateStoreId = (storeId) => {
  if (!mongoose.isValidObjectId(storeId)) {
    throw new ApiError(400, "Invalid store ID");
  }
  return storeId;
};

export const validateListStoresQuery = (query = {}) => {
  const page = Number(query.page || STORE_DEFAULTS.DEFAULT_PAGE);
  const limit = Number(query.limit || STORE_DEFAULTS.DEFAULT_LIMIT);
  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(400, "Page must be a positive integer");
  }
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > STORE_DEFAULTS.MAX_LIMIT
  ) {
    throw new ApiError(
      400,
      `Limit must be between 1 and ${STORE_DEFAULTS.MAX_LIMIT}`,
    );
  }

  const status = query.status?.trim();
  if (status && !Object.values(Store.STATUS).includes(status)) {
    throw new ApiError(400, "Invalid store status");
  }

  const search = query.search?.trim();

  const sortBy = query.sortBy?.trim() || STORE_DEFAULTS.DEFAULT_SORT_BY;
  if (!STORE_SORT_FIELDS.includes(sortBy)) {
    throw new ApiError(
      400,
      `Invalid sort field. Allowed fields: ${STORE_SORT_FIELDS.join(", ")}`,
    );
  }

  const sortOrder =
    query.sortOrder?.trim().toLowerCase() || STORE_DEFAULTS.DEFAULT_SORT_ORDER;
  if (!["asc", "desc"].includes(sortOrder)) {
    throw new ApiError(400, "Sort order must be either asc or desc");
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
