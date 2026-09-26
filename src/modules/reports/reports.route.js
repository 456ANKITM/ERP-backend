import { Router } from "express";

import { authenticate } from "@/middlewares/authenticate.js";
import { authorize } from "@/middlewares/authorize.js";
import { ROLES } from "@/constants/roles.js";

import {
  salesSummaryController,
  inventoryValuationController,
  profitLossController,
  topProductsController,
  storeComparisonController,
  staffPerformanceController,
  exportReportController,
} from "./reports.controller.js";

const router = Router();

router.use(authenticate);

router.get(
  "/sales-summary",
  authorize(ROLES.OWNER, ROLES.STORE_MANAGER),
  salesSummaryController,
);

router.get(
  "/inventory-valuation",
  authorize(ROLES.OWNER, ROLES.STORE_MANAGER),
  inventoryValuationController,
);

router.get("/profit-loss", authorize(ROLES.OWNER), profitLossController);

router.get(
  "/top-products",
  authorize(ROLES.OWNER, ROLES.STORE_MANAGER),
  topProductsController,
);

router.get("/store-comparison", authorize(ROLES.OWNER), storeComparisonController);

router.get("/staff-performance", authorize(ROLES.OWNER), staffPerformanceController);

router.get(
  "/export",
  authorize(ROLES.OWNER, ROLES.STORE_MANAGER),
  exportReportController,
);

export default router;