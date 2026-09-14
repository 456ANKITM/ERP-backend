import { Router } from "express";

import { authenticate } from "@/middlewares/authenticate.js";
import { authorize } from "@/middlewares/authorize.js";
import asyncHandler from "@/utils/asyncHandler.js";
import { ROLES } from "@/constants/roles.js";

import {
  listBusinesses,
  getBusinessDetails,
  updateBusinessStatus,
  getBusinessAnalytics,
  deleteBusiness,
} from "./business-management.controller.js";

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN));

router.get(
  "/",
  asyncHandler(listBusinesses),
);

router.get(
  "/:id",
  asyncHandler(getBusinessDetails),
);

router.patch(
  "/:id/status",
  asyncHandler(updateBusinessStatus),
);

router.get(
  "/:id/analytics",
  asyncHandler(getBusinessAnalytics),
);

router.delete(
  "/:id",
  asyncHandler(deleteBusiness),
);

export default router;