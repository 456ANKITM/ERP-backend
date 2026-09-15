import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate.js";
import { authorize } from "@/middlewares/authorize.js";
import { validateBody } from "@/middlewares/validate.js";
import { ROLES } from "@/constants/roles.js";
import {
  createStoreSchema,
  updateStoreSchema,
  assignManagerSchema,
} from "./stores.validator.js";
import {
  createStoreController,
  listStoresController,
  getStoreDetailsController,
  updateStoreController,
  deactivateStoreController,
  assignManagerController,
} from "./stores.controller.js";

const router = Router();
router.use(authenticate);
router.use(authorize(ROLES.OWNER));

router.post("/", validateBody(createStoreSchema), createStoreController);

router.get("/", listStoresController);

router.get("/:id", getStoreDetailsController);

router.patch("/:id", validateBody(updateStoreSchema), updateStoreController);

router.delete("/:id", deactivateStoreController);

router.patch(
  "/:id/assign-manager",
  validateBody(assignManagerSchema),
  assignManagerController,
);

export default router;