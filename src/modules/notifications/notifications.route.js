import { Router } from "express";

import { authenticate } from "@/middlewares/authenticate.js";

import {
  listNotificationsController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
} from "./notifications.controller.js";

const router = Router();

// No role restriction — every authenticated user (Super Admin, Owner,
// Store Manager) reads and manages only their own notifications.
router.use(authenticate);

router.get("/", listNotificationsController);

// Static path before the dynamic "/:id/read" below.
router.patch("/mark-all-read", markAllNotificationsAsReadController);

router.patch("/:id/read", markNotificationAsReadController);

export default router;