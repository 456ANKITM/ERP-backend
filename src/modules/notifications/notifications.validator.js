import mongoose from "mongoose";

import Notification from "@/models/Notification.model.js";
import ApiError from "@/utils/ApiError.js";

import { NOTIFICATION_DEFAULTS } from "./notifications.constants.js";

export const validateNotificationId = (notificationId) => {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new ApiError(400, "Invalid notification ID");
  }
  return notificationId;
};

export const validateListNotificationsQuery = (query = {}) => {
  const page = Number(query.page || NOTIFICATION_DEFAULTS.DEFAULT_PAGE);
  const limit = Number(query.limit || NOTIFICATION_DEFAULTS.DEFAULT_LIMIT);

  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(400, "Page must be a positive integer");
  }

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > NOTIFICATION_DEFAULTS.MAX_LIMIT
  ) {
    throw new ApiError(400, `Limit must be between 1 and ${NOTIFICATION_DEFAULTS.MAX_LIMIT}`);
  }

  let isRead;
  if (query.isRead !== undefined) {
    if (query.isRead !== "true" && query.isRead !== "false") {
      throw new ApiError(400, "isRead must be either true or false");
    }
    isRead = query.isRead === "true";
  }

  const type = query.type?.trim();
  if (type && !Object.values(Notification.TYPES).includes(type)) {
    throw new ApiError(400, "Invalid notification type");
  }

  return {
    page,
    limit,
    isRead: isRead === undefined ? null : isRead,
    type: type || null,
  };
};