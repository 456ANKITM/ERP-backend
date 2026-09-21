import asyncHandler from "@/utils/asyncHandler";
import {
  createSupplier,
  getSupplierDetails,
  listSuppliers,
  removeSupplier,
  updateSupplier,
} from "./suppliers.service";
import { SUPPLIER_MESSAGES } from "./suppliers.constants";

export const createSupplierControllers = asyncHandler(async (req, res) => {
  const supplier = await createSupplier({ user: req.user, data: req.body });
  res.status(201).json({
    success: true,
    message: SUPPLIER_MESSAGES.CREATED,
    data: { supplier },
  });
});

export const listSupplierControllers = asyncHandler(async (req, res) => {
  const result = await listSuppliers({ user: req.user, query: req.query });
  res.status(201).json({
    success: true,
    message: SUPPLIER_MESSAGES.LIST_SUCCESS,
    data: result,
  });
});

export const getSupplierDetailsController = asyncHandler(async (req, res) => {
  const result = await getSupplierDetails({
    user: req.user,
    supplierId: req.params.id,
  });
  res.status(200).json({
    success: true,
    message: SUPPLIER_MESSAGES.DETAILS_SUCCESS,
    data: result,
  });
});

export const updateSupplierController = asyncHandler(async (req, res) => {
  const supplier = await updateSupplier({
    user: req.user,
    supplierId: req.params.id,
    data: req.body,
  });
  res.status(200).json({
    success: true,
    messagge: SUPPLIER_MESSAGES.UPDATED,
    data: { supplier },
  });
});

export const removeSupplierController = asyncHandler(async (req, res) => {
  const supplier = await removeSupplier({
    user: req.user,
    supplierId: req.params.id,
  });
  res.status(200).json({
    success: true,
    message: SUPPLIER_MESSAGES.REMOVED,
    data: { supplier },
  });
});
