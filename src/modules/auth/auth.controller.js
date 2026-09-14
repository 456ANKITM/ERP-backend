import asyncHandler from "@/utils/asyncHandler.js";

import {
  registerBusiness,
  login,
  refreshToken as refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
} from "./auth.service.js";

import {
  setRefreshTokenCookie,
  clearRefreshToken,
  getRefreshTokenFromRequest,
} from "@/utils/cookies.js";

export const registerBusinessController = asyncHandler(async (req, res) => {
  const result = await registerBusiness(req.body);

  res.status(201).json({
    success: true,
    message: "Business registered successfully",
    data: result,
  });
});

export const loginController = asyncHandler(async (req, res) => {
  const result = await login({
    ...req.body,
    req,
  });

  setRefreshTokenCookie(res, result.refreshToken);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

export const refreshTokenController = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);

  const result = await refreshAccessToken({
    refreshToken,
    req,
  });

  setRefreshTokenCookie(res, result.refreshToken);

  res.status(200).json({
    success: true,
    message: "Access token refreshed",
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

export const logoutController = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);

  await logout({
    refreshToken,
  });

  clearRefreshToken(res);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export const forgotPasswordController = asyncHandler(async (req, res) => {
  const result = await forgotPassword(req.body);

  if (result && process.env.NODE_ENV === "development") {
    console.log("PASSWORD RESET TOKEN:", result.token);
  }

  res.status(200).json({
    success: true,
    message:
      "If an account exists with this email, password reset instructions have been sent.",
  });
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  await resetPassword(req.body);

  clearRefreshToken(res);

  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});

export const meController = asyncHandler(async (req, res) => {
  const result = await getMe(req.user._id);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const changePasswordController = asyncHandler(async (req, res) => {
  await changePassword({
    userId: req.user._id,
    ...req.body,
  });

  clearRefreshToken(res);

  res.status(200).json({
    success: true,
    message: "Password changed successfully. Please login again.",
  });
});
