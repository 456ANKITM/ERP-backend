import asyncHandler from "@/utils/asyncHandler.js";

import {
  getBusinessSettings,
  updateBusinessSettings,
  updateStoreSettings,
} from "./settings.service.js";

import { SETTINGS_MESSAGES } from "./settings.constants.js";

export const getBusinessSettingsController = asyncHandler(async (req, res) => {
  const result = await getBusinessSettings({ user: req.user });

  res.status(200).json({
    success: true,
    message: SETTINGS_MESSAGES.BUSINESS_FETCHED,
    data: result,
  });
});

export const updateBusinessSettingsController = asyncHandler(async (req, res) => {
  const result = await updateBusinessSettings({ user: req.user, data: req.body });

  res.status(200).json({
    success: true,
    message: SETTINGS_MESSAGES.BUSINESS_UPDATED,
    data: result,
  });
});

export const updateStoreSettingsController = asyncHandler(async (req, res) => {
  const result = await updateStoreSettings({
    user: req.user,
    storeId: req.params.id,
    data: req.body,
  });

  res.status(200).json({
    success: true,
    message: SETTINGS_MESSAGES.STORE_SETTINGS_UPDATED,
    data: result,
  });
});