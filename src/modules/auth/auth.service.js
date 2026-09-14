import mongoose from "mongoose";

import User, { USER_STATUS, USER_ROLES } from "@/models/User.model.js";

import Business from "@/models/Business.model.js";
import Store from "@/models/Store.model.js";
import Session from "@/models/Session.model.js";
import PasswordResetToken from "@/models/PasswordResetToken.model.js";

import ApiError from "@/utils/ApiError.js";

import { hashPassword, comparePassword } from "@/utils/password.js";

import {
  generateRefreshToken,
  generatePasswordResetToken,
  hashToken,
} from "@/utils/tokens.js";

import { signAccessToken } from "@/utils/jwt.js";

import { env } from "@/config/env.js";

const buildUserResponse = (user) => {
  const result = user.toObject();

  delete result.passwordHash;

  return result;
};

const createSession = async ({ user, req }) => {
  const refreshToken = generateRefreshToken();

  const tokenHash = hashToken(refreshToken);

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const session = await Session.create({
    userId: user._id,
    tokenHash,
    expiresAt,
    userAgent: req.headers["user-agent"] || null,
    ipAddress: req.ip || null,
    lastUsedAt: new Date(),
  });

  return {
    refreshToken,
    session,
  };
};

const createAccessToken = (user) => {
  return signAccessToken({
    userId: user._id,
    role: user.role,
    businessId: user.businessId,
    storeId: user.storeId,
  });
};

export const registerBusiness = async ({
  name,
  email,
  password,
  businessName,
}) => {
  const session = await mongoose.startSession();

  try {
    let createdUser;

    await session.withTransaction(async () => {
      const existingUser = await User.findOne({
        email,
        deletedAt: null,
      }).session(session);

      if (existingUser) {
        throw new ApiError(409, "Unable to register with these details");
      }

      const existingBusiness = await Business.findOne({
        slug: businessName
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      }).session(session);

      if (existingBusiness) {
        throw new ApiError(409, "Business name is already taken");
      }

      const passwordHash = await hashPassword(password);

      const businessSlug = businessName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const [business] = await Business.create(
        [
          {
            name: businessName,
            slug: businessSlug,
            status: "TRIAL",
            subscriptionPlan: "TRIAL",
            contactEmail: email,
          },
        ],
        { session },
      );

      const [user] = await User.create(
        [
          {
            name,
            email,
            passwordHash,
            role: USER_ROLES.OWNER,
            businessId: business._id,
            storeId: null,
            status: USER_STATUS.ACTIVE,
            emailVerifiedAt: null,
          },
        ],
        { session },
      );

      business.ownerId = user._id;
      business.createdBy = user._id;

      await business.save({
        session,
      });

      user.createdBy = user._id;

      await user.save({
        session,
      });

      createdUser = user;
    });

    return {
      user: buildUserResponse(createdUser),
    };
  } finally {
    await session.endSession();
  }
};

export const login = async ({ email, password, req }) => {
  const user = await User.findOne({
    email,
    deletedAt: null,
  }).select("+passwordHash");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status !== USER_STATUS.ACTIVE) {
    throw new ApiError(403, "Account is not active");
  }

  const passwordValid = await comparePassword(password, user.passwordHash);

  if (!passwordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  user.lastLoginAt = new Date();

  await user.save();

  const accessToken = createAccessToken(user);

  const { refreshToken, session } = await createSession({
    user,
    req,
  });

  return {
    accessToken,
    refreshToken,
    session,
    user: buildUserResponse(user),
  };
};

export const refreshToken = async ({ refreshToken, req }) => {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  const tokenHash = hashToken(refreshToken);

  const session = await Session.findOne({
    tokenHash,
    revokedAt: null,
  })
    .select("+tokenHash")
    .populate("userId");

  if (!session) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  if (session.expiresAt <= new Date()) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = session.userId;

  if (!user || user.deletedAt || user.status !== USER_STATUS.ACTIVE) {
    session.revokedAt = new Date();

    await session.save();

    throw new ApiError(401, "Account is not active");
  }

  // Rotate refresh token
  const newRefreshToken = generateRefreshToken();

  const newTokenHash = hashToken(newRefreshToken);

  const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const newSession = await Session.create({
    userId: user._id,
    tokenHash: newTokenHash,
    expiresAt: newExpiresAt,
    userAgent: req.headers["user-agent"] || null,
    ipAddress: req.ip || null,
    lastUsedAt: new Date(),
  });

  session.revokedAt = new Date();

  session.replacedBySessionId = newSession._id;

  await session.save();

  const accessToken = createAccessToken(user);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: buildUserResponse(user),
  };
};

export const logout = async ({ refreshToken }) => {
  if (!refreshToken) {
    return;
  }

  const tokenHash = hashToken(refreshToken);

  await Session.updateOne(
    {
      tokenHash,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
  );
};

export const getMe = async (userId) => {
  const user = await User.findOne({
    _id: userId,
    deletedAt: null,
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  let business = null;
  let store = null;

  if (user.businessId) {
    business = await Business.findOne({
      _id: user.businessId,
      deletedAt: null,
    }).lean();
  }

  if (user.storeId) {
    store = await Store.findOne({
      _id: user.storeId,
      deletedAt: null,
    }).lean();
  }

  return {
    user: buildUserResponse(user),
    business,
    store,
  };
};

export const changePassword = async ({
  userId,
  currentPassword,
  newPassword,
}) => {
  const user = await User.findOne({
    _id: userId,
    deletedAt: null,
  }).select("+passwordHash");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const valid = await comparePassword(currentPassword, user.passwordHash);

  if (!valid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.passwordHash = await hashPassword(newPassword);

  user.passwordChangedAt = new Date();

  await user.save();

  // Revoke all existing refresh sessions.
  await Session.updateMany(
    {
      userId: user._id,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
  );
};

export const forgotPassword = async ({ email }) => {
  const user = await User.findOne({
    email,
    deletedAt: null,
  });

  // Important: don't reveal whether
  // the account exists.
  if (!user) {
    return null;
  }

  const rawToken = generatePasswordResetToken();

  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date(
    Date.now() + env.PASSWORD_RESET_EXPIRES_MINUTES * 60 * 1000,
  );

  await PasswordResetToken.deleteMany({
    userId: user._id,
  });

  await PasswordResetToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
  });

  return {
    token: rawToken,
    expiresAt,
  };
};

export const resetPassword = async ({ token, password }) => {
  const tokenHash = hashToken(token);

  const resetToken = await PasswordResetToken.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: {
      $gt: new Date(),
    },
  })
    .select("+tokenHash")
    .populate("userId");

  if (!resetToken) {
    throw new ApiError(400, "Invalid or expired password reset token");
  }

  const user = resetToken.userId;

  if (!user || user.deletedAt) {
    throw new ApiError(400, "Invalid or expired password reset token");
  }

  user.passwordHash = await hashPassword(password);

  user.passwordChangedAt = new Date();

  await user.save();

  resetToken.usedAt = new Date();

  await resetToken.save();

  // Kill existing sessions after reset.
  await Session.updateMany(
    {
      userId: user._id,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
  );
};
