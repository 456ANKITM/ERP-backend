import asyncHandler from "@/utils/asyncHandler";
import {
  createSale,
  getInvoiceData,
  getSaleDetails,
  listSales,
  refundSale,
} from "./sales.service";
import { SALE_MESSAGES } from "./sales.constants";
import { streamInvoicePdf } from "@/utils/invoicePdf";

export const createSaleController = asyncHandler(async (req, res) => {
  const sale = await createSale({ user: req.user, data: req.body });
  res.status(201).json({
    success: true,
    message: SALE_MESSAGES.CREATED,
    data: { sale },
  });
});

export const listSalesController = asyncHandler(async (req, res) => {
  const result = await listSales({ user: req.user, query: req.query });
  res.status(200).json({
    success: true,
    message: SALE_MESSAGES.LIST_SUCCESS,
    data: result,
  });
});

export const getSaleDetailsController = asyncHandler(async (req, res) => {
  const result = await getSaleDetails({
    user: req.user,
    saleId: req.params.id,
  });
  res.status(200).json({
    success: true,
    message: SALE_MESSAGES.DETAILS_SUCCESS,
    data: result,
  });
});

export const refundSaleController = asyncHandler(async (req, res) => {
  const result = await refundSale({
    user: req.user,
    saleId: req.params.id,
    data: req.body,
  });
  res.status(200).json({
    success: true,
    message: SALE_MESSAGES.REFUNDED,
    data: result,
  });
});

export const downloadInvoiceController = asyncHandler(async (req, res) => {
  const { sale, business, store, customer } = await getInvoiceData({
    user: req.user,
    saleId: req.params.id,
  });
  streamInvoicePdf({ res, business, store, sale, customer });
});
