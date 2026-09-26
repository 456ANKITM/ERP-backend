import asyncHandler from "@/utils/asyncHandler.js";

import {
  listNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./notifications.service.js";

import { NOTIFICATION_MESSAGES } from "./notifications.constants.js";

export const listNotificationsController = asyncHandler(async (req, res) => {
  const result = await listNotifications({ user: req.user, query: req.query });

  res.status(200).json({
    success: true,
    message: NOTIFICATION_MESSAGES.LIST_SUCCESS,
    data: result,
  });
});

export const markNotificationAsReadController = asyncHandler(async (req, res) => {
  const notification = await markNotificationAsRead({
    user: req.user,
    notificationId: req.params.id,
  });

  res.status(200).json({
    success: true,
    message: NOTIFICATION_MESSAGES.MARKED_READ,
    data: { notification },
  });
});

export const markAllNotificationsAsReadController = asyncHandler(async (req, res) => {
  const result = await markAllNotificationsAsRead({ user: req.user });

  res.status(200).json({
    success: true,
    message: NOTIFICATION_MESSAGES.ALL_MARKED_READ,
    data: result,
  });
});