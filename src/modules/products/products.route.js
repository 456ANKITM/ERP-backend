import { ROLES } from "@/constants/roles";
import { authenticate } from "@/middlewares/authenticate";
import { authorize } from "@/middlewares/authorize";
import { Router } from "express";
import {
  adjustStockController,
  createProductController,
  deactivateProductController,
  getProductDetailsController,
  listLowStockProductsController,
  listProductsController,
  updateProductController,
} from "./products.controller";
import { validateBody } from "@/middlewares/validate";
import {
  adjustStockSchema,
  createProductSchema,
  updateProductSchema,
} from "./products.validator";

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.OWNER, ROLES.STORE_MANAGER));

router.get("/low-stock", listLowStockProductsController);
router.post("/", validateBody(createProductSchema), createProductController);
router.get("/", listProductsController);
router.get("/:id", getProductDetailsController);
router.patch(
  "/:id",
  validateBody(updateProductSchema),
  updateProductController,
);
router.delete("/:id", deactivateProductController);
router.patch(
  "/:id/adjust-stock",
  validateBody(adjustStockSchema),
  adjustStockController,
);

export default router;
