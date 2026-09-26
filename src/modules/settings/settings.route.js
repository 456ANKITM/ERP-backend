import { Router } from "express";

import { authenticate } from "@/middlewares/authenticate.js";
import { authorize } from "@/middlewares/authorize.js";
import { validateBody } from "@/middlewares/validate.js";
import { ROLES } from "@/constants/roles.js";

import {
  updateBusinessSettingsSchema,
  updateStoreSettingsSchema,
} from "./settings.validator.js";

import {
  getBusinessSettingsController,
  updateBusinessSettingsController,
  updateStoreSettingsController,
} from "./settings.controller.js";

const router = Router();

router.use(authenticate);

router.get("/business", authorize(ROLES.OWNER), getBusinessSettingsController);

router.patch(
  "/business",
  authorize(ROLES.OWNER),
  validateBody(updateBusinessSettingsSchema),
  updateBusinessSettingsController,
);

router.patch(
  "/store/:id",
  authorize(ROLES.OWNER, ROLES.STORE_MANAGER),
  validateBody(updateStoreSettingsSchema),
  updateStoreSettingsController,
);

export default router;