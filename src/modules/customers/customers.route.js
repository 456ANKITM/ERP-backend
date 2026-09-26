import { Router } from "express";

import { authenticate } from "@/middlewares/authenticate.js";
import { authorize } from "@/middlewares/authorize.js";
import { validateBody } from "@/middlewares/validate.js";
import { ROLES } from "@/constants/roles.js";

import {
  createCustomerSchema,
  updateCustomerSchema,
} from "./customers.validator.js";

import {
  createCustomerController,
  listCustomersController,
  getCustomerDetailsController,
  updateCustomerController,
} from "./customers.controller.js";

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.OWNER, ROLES.STORE_MANAGER));

router.post("/", validateBody(createCustomerSchema), createCustomerController);
router.get("/", listCustomersController);
router.get("/:id", getCustomerDetailsController);
router.patch("/:id", validateBody(updateCustomerSchema), updateCustomerController);

export default router;