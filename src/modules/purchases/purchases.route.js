import { Router } from "express";

import { authenticate } from "@/middlewares/authenticate.js";
import { authorize } from "@/middlewares/authorize.js";
import { validateBody } from "@/middlewares/validate.js";
import { ROLES } from "@/constants/roles.js";

import {
  createPurchaseSchema,
  updatePaymentStatusSchema,
} from "./purchases.validator.js";

import {
  createPurchaseController,
  listPurchasesController,
  getPurchaseDetailsController,
  updatePaymentStatusController,
  cancelPurchaseController,
} from "./purchases.controller.js";

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.OWNER, ROLES.STORE_MANAGER));

router.post("/", validateBody(createPurchaseSchema), createPurchaseController);
router.get("/", listPurchasesController);
router.get("/:id", getPurchaseDetailsController);
router.patch(
  "/:id/payment-status",
  validateBody(updatePaymentStatusSchema),
  updatePaymentStatusController,
);
router.delete("/:id", cancelPurchaseController);

export default router;