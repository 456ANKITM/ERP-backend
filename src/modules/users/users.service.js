import mongoose from "mongoose";
import User, { USER_ROLES, USER_STATUS } from "@/models/User.model.js";
import Store from "@/models/Store.model.js";
import Session from "@/models/Session.model.js";
import Invitation from "@/models/Invitation.model.js";
import ApiError from "@/utils/ApiError.js";
import { hashPassword } from "@/utils/password.js";
import { generatePasswordResetToken, hashToken } from "@/utils/tokens.js";
import { env } from "@/config/env.js";
import { USER_MESSAGES } from "./users.constants.js";
import { validateUserId, validateListUsersQuery } from "./users.validator.js";

const buildPagination = ({ page, limit, total }) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const storeFields = "name code status";

// An owner may only ever touch the Store Managers inside their own business and never their own account. Everythingg mutating goes through this

const findManagedStaff = async ({ businessId, ownerId, userId }) => {
  validateUserId(userId);

  if (String(userId) === String(ownerId)) {
    throw new ApiError(403, USER_MESSAGES.CANNOT_MANAGE_SELF);
  }

  const staff = await User.findOne({
    _id: userId,
    businessId,
    deletedAt: null,
  });

  if (!staff) {
    throw new ApiError(404, USER_MESSAGES.USER_NOT_FOUND);
  }

  if (staff.role !== USER_ROLES.STORE_MANAGER) {
    throw new ApiError(403, USER_MESSAGES.CANNOT_MANAGE_ROLE);
  }

  return staff;
};

const assertStoreInBusiness = async ({
  businessId,
  storeId,
  session = null,
}) => {
  const query = Store.findOne({ _id: storeId, businessId, deletedAt: null });
  if (session) query.session(session);
  const store = await query;

  if (!store) {
    throw new ApiError(404, USER_MESSAGES.STORE_NOT_FOUND);
  }

  return store;
};

export const inviteUser = async ({ businessId, ownerId, data }) => {
 const store = await assertStoreInBusiness({
  businessId,
  storeId: data.storeId,
});
  const existing = await User.findOne({
    email: data.email,
    deletedAt: null,
  });
  if (existing) {
    throw new ApiError(409, USER_MESSAGES.EMAIL_TAKEN);
  }
  const rawToken = generatePasswordResetToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + env.INVITE_EXPIRES_HOURS * 60 * 60 * 1000,
  );
  const session = await mongoose.startSession();
  let createdUser;
  try {
    await session.withTransaction(async () => {
      const [user] = await User.create(
        [
          {
            name: data.name,
            email: data.email,
            ...(data.phone ? { phone: data.phone } : {}),
            role: USER_ROLES.STORE_MANAGER,
            businessId,
            storeId: store._id,
            status: USER_STATUS.INVITED,
            createdBy: ownerId,
          },
        ],
        { session },
      );

      await Invitation.create(
        [
          {
            userId: user._id,
            businessId,
            tokenHash,
            expiresAt,
            invitedBy: ownerId,
          },
        ],
        { session },
      );
      createdUser = user;
    });
  } finally {
    await session.endSession();
  }
  return {
    user: createdUser.toObject(),
    inviteToken: rawToken,
    expiresAt,
  };
};

export const listUsers = async ({ businessId, ownerId, query }) => {
  const { page, limit, status, storeId, search, sortBy, sortOrder } =
    validateListUsersQuery(query);
  const skip = (page - 1) * limit;
  const filter = {
    businessId,
    deletedAt: null,
    role: USER_ROLES.STORE_MANAGER,
    _id: { $ne: ownerId },
  };
  if (status) filter.status = status;
  if (storeId) filter.storeId = storeId;

  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { email: { $regex: safeSearch, $options: "i" } },
    ];
  }
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
  sort._id = sortOrder === "asc" ? 1 : -1;
  const [users, total] = await Promise.all([
    User.find(filter)
      .populate({ path: "storeId", select: storeFields })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return { users, pagination: buildPagination({ page, limit, total }) };
};

export const getUserDetails = async ({ businessId, ownerId, userId }) => {
  validateUserId(userId);
  const user = await User.findOne({
    _id: userId,
    businessId,
    deletedAt: null,
    role: USER_ROLES.STORE_MANAGER,
  }).populate({ path: "storeId", select: storeFields });
  if (!user || String(user._id) === String(ownerId)) {
    throw new ApiError(404, USER_MESSAGES.USER_NOT_FOUND);
  }
  const [activeSessions, pendingInvite] = await Promise.all([
    Session.countDocuments({
      userId: user._id,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }),
    Invitation.findOne({
      userId: user._id,
      acceptedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .select("expiresAt createdAt")
      .lean(),
  ]);

  return {
    user: user.toObject(),
    activeSessions,
    pendingInvite: pendingInvite || null,
  };
};

export const updateUser = async ({ businessId, ownerId, userId, data }) => {
  const staff = await findManagedStaff({ businessId, ownerId, userId });
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (data.storeId && String(data.storeId) !== String(staff.storeId)) {
      const newStore = await assertStoreInBusiness({
  businessId,
  storeId: data.storeId,
  session,
});
        // free the store this manager currently runs
        if (staff.storeId) {
          await Store.updateOne(
            { _id: staff.storeId, storeManagerId: staff._id },
            { $set: { storeManagerId: null } },
            { session },
          );
        }

        // if the new store already have a different managger detach them
        if (
          newStore.storeManagerId &&
          !newStore.storeManagerId.equals(staff._id)
        ) {
          await User.updateOne(
            { _id: newStore.storeManagerId, storeId: newStore._id },
            { $set: { storeId: null } },
            { session },
          );
        }
        await Store.updateOne(
          { _id: newStore._id },
          { $set: { storeManagerId: staff._id, updatedBy: ownerId } },
          { session },
        );
        staff.storeId = newStore._id;
      }
      if (data.name !== undefined) staff.name = data.name;
      if (data.phone !== undefined) staff.phone = data.phone;

      staff.updatedBy = ownerId;

      await staff.save({ session });
    });
  } finally {
    await session.endSession();
  }
  return staff.toObject();
};

export const updateUserStatus = async ({
  businessId,
  ownerId,
  userId,
  status,
}) => {
  const staff = await findManagedStaff({ businessId, ownerId, userId });
  if (staff.status === USER_STATUS.INVITED) {
    throw new ApiError(409, USER_MESSAGES.STILL_INVITED);
  }
  if (staff.status === status) {
    throw new ApiError(409, USER_MESSAGES.ALREADY_HAS_STATUS);
  }

  const previousStatus = staff.status;
  staff.status = status;
  staff.updatedBy = ownerId;

  await staff.save();

  // Losing ACTIVE Status kills every live session immediately.
  if (status !== USER_STATUS.ACTIVE) {
    await Session.updateMany(
      { userId: staff._id, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  }

  return { user: staff.toObject(), previousStatus };
};

export const removeUser = async ({businessId, ownerId, userId}) => {
    const staff = await findManagedStaff({businessId, ownerId, userId});
    const storeId = staff.storeId; 
    const now = new Date(); 
    const session = await mongoose.startSession();
    try{
        await session.withTransaction(async () => {
            await User.updateOne(
                {_id: staff._id}, 
                {
                    $set: {
                        status: USER_STATUS.DISABLED, 
                        storeId: null, 
                        deletedAt: now, 
                        deletedBy: ownerId, 
                        updatedBy: ownerId
                    }
                },
                {session}
            )
            if(storeId) {
                await Store.updateOne(
                    {_id: storeId, storeManagerId:staff._id}, 
                    {$set: {storeManagerId:null, updatedBy: ownerId}}, 
                    {session}
                )
            }

            await Session.updateMany(
                {userId:staff._id, revokedAt: null}, 
                {$set: {revokedAt: now}},
                {session}
            ) 

            await Invitation.updateMany (
              {userId: staff._id, acceptedAt: null}, 
              {$set: {expiresAt: now}}, 
              {session}
            )
        })
    } finally {
        await session.endSession();
    }

    return {
        id: staff._id, 
        name: staff.name, 
        email: staff.email, 
        deletedAt: now, 
        deletedBy: ownerId
    }
}

export const acceptInvite = async ({token, password}) => {
    const tokenHash = hashToken(token); 
    const invitation = await Invitation.findOne({
        tokenHash, 
        acceptedAt: null,
        expiresAt: {$gt: new Date()}
    })
    .select("+tokenHash")
    .populate("userId")

    if(!invitation) {
        throw new ApiError(400, USER_MESSAGES.INVALID_INVITE)
    }
    const user = invitation.userId; 
    if(!user || user.deletedAt || user.status !== USER_STATUS.INVITED) {
        throw new ApiError(400, USER_MESSAGES.INVALID_INVITE)
    }
    user.passwordHash = await hashPassword(password); 
    user.status = USER_STATUS.ACTIVE; 
    user.emailVerifiedAt = new Date(); 
    user.passwordChangedAt = new Date(); 

    await user.save(); 

    invitation.acceptedAt = new Date(); 
    await invitation.save(); 

    return {user: user.toObject()}
};