import { ROLES } from "@/constants/roles";
import { authenticate } from "@/middlewares/authenticate";
import { authorize } from "@/middlewares/authorize";
import { validateBody } from "@/middlewares/validate";
import { Router } from "express";
import { createSaleSchema, refundSchema } from "./sales.validator";
import {
  createSaleController,
  downloadInvoiceController,
  getSaleDetailsController,
  listSalesController,
  refundSaleController,
} from "./sales.controller";

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.OWNER, ROLES.STORE_MANAGER));

router.post("/", validateBody(createSaleSchema), createSaleController);
router.get("/", listSalesController);
router.get("/:id", getSaleDetailsController);
router.post("/:id/refund", validateBody(refundSchema), refundSaleController);
router.get("/:id/invoice", downloadInvoiceController);

export default router;
