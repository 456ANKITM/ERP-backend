import asyncHandler from "@/utils/asyncHandler.js";

import {
  createPurchase,
  listPurchases,
  getPurchaseDetails,
  updatePaymentStatus,
  cancelPurchase,
} from "./purchases.service.js";

import { PURCHASE_MESSAGES } from "./purchases.constants.js";

export const createPurchaseController = asyncHandler(async (req, res) => {
  const purchase = await createPurchase({ user: req.user, data: req.body });

  res.status(201).json({
    success: true,
    message: PURCHASE_MESSAGES.CREATED,
    data: { purchase },
  });
});

export const listPurchasesController = asyncHandler(async (req, res) => {
  const result = await listPurchases({ user: req.user, query: req.query });

  res.status(200).json({
    success: true,
    message: PURCHASE_MESSAGES.LIST_SUCCESS,
    data: result,
  });
});

export const getPurchaseDetailsController = asyncHandler(async (req, res) => {
  const result = await getPurchaseDetails({
    user: req.user,
    purchaseId: req.params.id,
  });

  res.status(200).json({
    success: true,
    message: PURCHASE_MESSAGES.DETAILS_SUCCESS,
    data: result,
  });
});

export const updatePaymentStatusController = asyncHandler(async (req, res) => {
  const purchase = await updatePaymentStatus({
    user: req.user,
    purchaseId: req.params.id,
    data: req.body,
  });

  res.status(200).json({
    success: true,
    message: PURCHASE_MESSAGES.PAYMENT_UPDATED,
    data: { purchase },
  });
});

export const cancelPurchaseController = asyncHandler(async (req, res) => {
  const purchase = await cancelPurchase({
    user: req.user,
    purchaseId: req.params.id,
  });

  res.status(200).json({
    success: true,
    message: PURCHASE_MESSAGES.CANCELLED,
    data: { purchase },
  });
});