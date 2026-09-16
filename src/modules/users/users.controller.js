import asyncHandler from "@/utils/asyncHandler.js";
import { acceptInvite, getUserDetails, inviteUser, listUsers, removeUser, updateUser, updateUserStatus } from "./users.service.js";
import { USER_MESSAGES } from "./users.constants.js";

export const inviteUserController = asyncHandler(async (req, res) => {
  const result = await inviteUser({
    businessId: req.user.businessId,
    ownerId: req.user._id,
    data: req.body,
  });

  if (process.env.NODE_ENV === "development") {
    console.log("STAFF INVITE TOKEN:", result.inviteToken);
  }

  res.status(201).json({
    success: true,
    message: USER_MESSAGES.INVITED,
    data: {
      user: result.user,
      expiresAt: result.expiresAt,
      ...(process.env.NODE_ENV === "development"
        ? { inviteToken: result.inviteToken }
        : {}),
    },
  });
});

export const listUsersController = asyncHandler(async (req, res) => {
    const result = await listUsers({
        businessId: req.user.businessId, 
        ownerId: req.user._id, 
        query: req.query
    }); 
    res.status(200).json({
        success:true,
        message:USER_MESSAGES.LIST_SUCCESS, 
        data: result
    })
})

export const getUserDetailsController = asyncHandler(async (req, res) => {
    const result = await getUserDetails({
        businessId: req.user.businessId, 
        ownerId: req.user._id, 
        userId: req.params.id,
    }); 
    res.status(200).json({
        success:true, 
        message:USER_MESSAGES.DETAILS_SUCCESS, 
        data: result
    })
})

export const updateUserController = asyncHandler(async (req, res) => {
    const user = await updateUser({
        businessId: req.user.businessId, 
        ownerId: req.user._id, 
        userId: req.params.id, 
        data: req.body
    }); 
    res.status(200).json({
        success:true, 
        message:USER_MESSAGES.UPDATED, 
        data: {user}
    })
})

export const updateUserStatusController = asyncHandler(async (req, res) => {
    const result = await  updateUserStatus({
        businessId: req.user.businessId, 
        ownerId: req.user._id, 
        userId: req.params.id, 
        status: req.body.status
    }); 
    res.status(200).json({
        success:true,
        message:USER_MESSAGES.STATUS_UPDATED, 
        data: result
    })
})

export const removeUserController = asyncHandler(async (req, res) => {
    const result = await removeUser({
        businessId: req.user.businessId, 
        ownerId: req.user._id, 
        userId: req.params.id
    })
    res.status(200).json({
        success:true, 
        message:USER_MESSAGES.REMOVED, 
        data: result
    })
})

export const acceptInviteController = asyncHandler(async (req, res) => {
    const result = await acceptInvite(req.body); 
    res.status(200).json({
        success:true, 
        message:USER_MESSAGES.INVITE_ACCEPTED, 
        data: result
    })
})