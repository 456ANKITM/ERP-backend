import express from "express";

import {
  registerBusinessController,
  loginController,
  refreshTokenController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
  meController,
  changePasswordController,
} from "./auth.controller.js";

import {
  registerBusinessSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "./auth.validation.js";

import {
  validateBody,
} from "@/middlewares/validate.js";

import {
  authenticate,
} from "@/middlewares/authenticate.js";

const router = express.Router();

// Public
router.post(
  "/register-business",
  validateBody(
    registerBusinessSchema,
  ),
  registerBusinessController,
);

router.post(
  "/login",
  validateBody(loginSchema),
  loginController,
);

router.post(
  "/refresh-token",
  refreshTokenController,
);

router.post(
  "/forgot-password",
  validateBody(
    forgotPasswordSchema,
  ),
  forgotPasswordController,
);

router.post(
  "/reset-password",
  validateBody(
    resetPasswordSchema,
  ),
  resetPasswordController,
);

// Authenticated
router.post(
  "/logout",
  authenticate,
  logoutController,
);

router.get(
  "/me",
  authenticate,
  meController,
);

router.post(
  "/change-password",
  authenticate,
  validateBody(
    changePasswordSchema,
  ),
  changePasswordController,
);

export default router;