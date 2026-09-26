import Notification from "@/models/Notification.model.js";
import User, { USER_ROLES, USER_STATUS } from "@/models/User.model.js";

import ApiError from "@/utils/ApiError.js";

import { NOTIFICATION_MESSAGES } from "./notifications.constants.js";
import {
  validateNotificationId,
  validateListNotificationsQuery,
} from "./notifications.validator.js";

const buildPagination = ({ page, limit, total }) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};


// Public endpoint logic

export const listNotifications = async ({ user, query }) => {
  const { page, limit, isRead, type } = validateListNotificationsQuery(query);

  const skip = (page - 1) * limit;

  const filter = { userId: user._id };
  if (isRead !== null) filter.isRead = isRead;
  if (type) filter.type = type;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: user._id, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: buildPagination({ page, limit, total }),
  };
};

export const markNotificationAsRead = async ({ user, notificationId }) => {
  validateNotificationId(notificationId);

  const notification = await Notification.findOne({
    _id: notificationId,
    userId: user._id,
  });

  if (!notification) {
    throw new ApiError(404, NOTIFICATION_MESSAGES.NOTIFICATION_NOT_FOUND);
  }

  if (notification.isRead) {
    return notification.toObject();
  }

  notification.isRead = true;
  notification.readAt = new Date();

  await notification.save();

  return notification.toObject();
};

export const markAllNotificationsAsRead = async ({ user }) => {
  const result = await Notification.updateMany(
    { userId: user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } },
  );

  return { modifiedCount: result.modifiedCount };
};


// Internal API — for other modules to call. Nothing above this
// line is reachable from a route; everything below is meant to be
// imported directly by other services (products, sales, purchases,
// users) at the point something notification-worthy happens.


export const createNotification = async ({
  userId,
  businessId = null,
  type,
  title,
  message,
  data = null,
}) => {
  return Notification.create({
    userId,
    businessId,
    type,
    title,
    message,
    data,
  });
};

export const notifyUsers = async ({ userIds, businessId, type, title, message, data }) => {
  const uniqueIds = [...new Set(userIds.map(String))];

  if (uniqueIds.length === 0) return [];

  return Notification.insertMany(
    uniqueIds.map((userId) => ({
      userId,
      businessId,
      type,
      title,
      message,
      data,
    })),
  );
};

// Notifies every Owner of a business, plus the store's assigned
// manager (if any), that a product has crossed into low/out-of-stock.
// Callers should only invoke this on the *crossing* transition (see
// the integration notes below the code) — not on every stock change —
// so a store isn't spammed with a notification per sale while it
// stays low.
export const notifyLowStock = async ({ businessId, storeId, product }) => {
  const [owners, store] = await Promise.all([
    User.find({
      businessId,
      role: USER_ROLES.OWNER,
      status: USER_STATUS.ACTIVE,
      deletedAt: null,
    }).select("_id"),

    storeId
      ? (await import("@/models/Store.model.js")).default
          .findOne({ _id: storeId, storeManagerId: { $ne: null } })
          .select("storeManagerId")
      : null,
  ]);

  const recipientIds = owners.map((o) => o._id);
  if (store?.storeManagerId) recipientIds.push(store.storeManagerId);

  const isOutOfStock = product.quantityInStock === 0;

  return notifyUsers({
    userIds: recipientIds,
    businessId,
    type: Notification.TYPES.LOW_STOCK,
    title: isOutOfStock ? "Product out of stock" : "Product running low",
    message: isOutOfStock
      ? `${product.name} (${product.sku}) is now out of stock.`
      : `${product.name} (${product.sku}) has ${product.quantityInStock} left, at or below the reorder level of ${product.recorderLevel}.`,
    data: {
      productId: product._id,
      storeId,
      quantityInStock: product.quantityInStock,
      recorderLevel: product.recorderLevel,
    },
  });
};