import asyncHandler from "@/utils/asyncHandler";
import {
  adjustStock,
  createProduct,
  deactivateProduct,
  getProductDetails,
  listLowStockProducts,
  listProducts,
  updateProduct,
} from "./products.service";
import { PRODUCT_MESSAGES } from "./products.constants";

export const createProductController = asyncHandler(async (req, res) => {
  const product = await createProduct({ user: req.user, data: req.body });
  res.status(201).json({
    success: true,
    message: PRODUCT_MESSAGES.CREATED,
    data: { product },
  });
});

export const listProductsController = asyncHandler(async (req, res) => {
  const result = await listProducts({ user: req.user, query: req.query });
  res.status(200).json({
    success: true,
    message: PRODUCT_MESSAGES.LIST_SUCCESS,
    data: result,
  });
});

export const getProductDetailsController = asyncHandler(async (req, res) => {
  const result = await getProductDetails({
    user: req.user,
    productId: req.params.id,
  });
  res.status(200).json({
    success: true,
    message: PRODUCT_MESSAGES.DETAILS_SUCCESS,
    data: result,
  });
});

export const updateProductController = asyncHandler(async (req, res) => {
  const product = await updateProduct({
    user: req.user,
    productId: req.params.id,
    data: req.body,
  });
  res.status(200).json({
    success: true,
    message: PRODUCT_MESSAGES.UPDATED,
    data: { product },
  });
});

export const deactivateProductController = asyncHandler(async (req, res) => {
  const product = await deactivateProduct({
    user: req.user,
    productId: req.params.id,
  });
  res.status(200).json({
    success: true,
    message: PRODUCT_MESSAGES.DEACTIVATED,
    data: { product },
  });
});

export const adjustStockController = asyncHandler(async (req, res) => {
  const result = await adjustStock({
    user: req.user,
    productId: req.params.id,
    quantityChange: req.body.quantityChange,
    reason: req.body.reason,
  });
  res.status(200).json({
    success: true,
    message: PRODUCT_MESSAGES.STOCK_ADJUSTED,
    data: result,
  });
});

export const listLowStockProductsController = asyncHandler(async (req, res) => {
  const result = await listLowStockProducts({
    user: req.user,
    query: req.query,
  });
  res.status(200).json({
    success: true,
    message: PRODUCT_MESSAGES.LOW_STOCK_SUCCESS,
    data: result,
  });
});
