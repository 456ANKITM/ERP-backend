import asyncHandler from "@/utils/asyncHandler.js";
import {
  createStore,
  listStores,
  getStoreDetails,
  updateStore,
  deactivateStore,
  assignManager,
} from "./stores.service.js";

import { STORE_MESSAGES } from "./stores.constants.js";

export const createStoreController = asyncHandler(async (req, res) => {
  const store = await createStore({
    businessId: req.user.businessId,
    ownerId: req.user._id,
    data: req.body,
  });

  res.status(201).json({
    success: true,
    message: STORE_MESSAGES.CREATED,
    data: { store },
  });
});

export const listStoresController = asyncHandler(async (req, res) => {
  const result = await listStores({
    businessId: req.user.businessId,
    query: req.query,
  });

  res.status(200).json({
    success: true,
    message: STORE_MESSAGES.LIST_SUCCESS,
    data: result,
  });
});

export const getStoreDetailsController = asyncHandler(async (req, res) => {
  const store = await getStoreDetails({
    businessId: req.user.businessId,
    storeId: req.params.id,
  });

  res.status(200).json({
    success: true,
    message: STORE_MESSAGES.DETAILS_SUCCESS,
    data: { store },
  });
});

export const updateStoreController = asyncHandler(async (req, res) => {
  const store = await updateStore({
    businessId: req.user.businessId,
    storeId: req.params.id,
    ownerId: req.user._id,
    data: req.body,
  });

  res.status(200).json({
    success: true,
    message: STORE_MESSAGES.UPDATED,
    data: { store },
  });
});

export const deactivateStoreController = asyncHandler(async (req, res) => {
  const store = await deactivateStore({
    businessId: req.user.businessId,
    storeId: req.params.id,
    ownerId: req.user._id,
  });

  res.status(200).json({
    success: true,
    message: STORE_MESSAGES.DEACTIVATED,
    data: { store },
  });
});

export const assignManagerController = asyncHandler(async (req, res) => {
  const result = await assignManager({
    businessId: req.user.businessId,
    storeId: req.params.id,
    ownerId: req.user._id,
    userId: req.body.userId,
  });

  res.status(200).json({
    success: true,
    message: STORE_MESSAGES.MANAGER_ASSIGNED,
    data: result,
  });
});
