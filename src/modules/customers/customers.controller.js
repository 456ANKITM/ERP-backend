import asyncHandler from "@/utils/asyncHandler.js";

import {
  createCustomer,
  listCustomers,
  getCustomerDetails,
  updateCustomer,
} from "./customers.service.js";

import { CUSTOMER_MESSAGES } from "./customers.constants.js";

export const createCustomerController = asyncHandler(async (req, res) => {
  const customer = await createCustomer({ user: req.user, data: req.body });

  res.status(201).json({
    success: true,
    message: CUSTOMER_MESSAGES.CREATED,
    data: { customer },
  });
});

export const listCustomersController = asyncHandler(async (req, res) => {
  const result = await listCustomers({ user: req.user, query: req.query });

  res.status(200).json({
    success: true,
    message: CUSTOMER_MESSAGES.LIST_SUCCESS,
    data: result,
  });
});

export const getCustomerDetailsController = asyncHandler(async (req, res) => {
  const result = await getCustomerDetails({
    user: req.user,
    customerId: req.params.id,
  });

  res.status(200).json({
    success: true,
    message: CUSTOMER_MESSAGES.DETAILS_SUCCESS,
    data: result,
  });
});

export const updateCustomerController = asyncHandler(async (req, res) => {
  const customer = await updateCustomer({
    user: req.user,
    customerId: req.params.id,
    data: req.body,
  });

  res.status(200).json({
    success: true,
    message: CUSTOMER_MESSAGES.UPDATED,
    data: { customer },
  });
});