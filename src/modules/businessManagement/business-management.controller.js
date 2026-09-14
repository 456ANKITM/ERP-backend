import * as businessManagementService from "./business-management.service.js";

export const listBusinesses = async (req, res) => {
  const result =
    await businessManagementService.listBusinesses(
      req.query,
    );

  return res.status(200).json({
    success: true,
    message: "Businesses fetched successfully",
    data: result,
  });
};

export const getBusinessDetails = async (req, res) => {
  const result =
    await businessManagementService.getBusinessDetails(
      req.params.id,
    );

  return res.status(200).json({
    success: true,
    message: "Business details fetched successfully",
    data: result,
  });
};

export const updateBusinessStatus = async (req, res) => {
  const result =
    await businessManagementService.updateBusinessStatus(
      req.params.id,
      req.body,
      req.user._id,
    );

  return res.status(200).json({
    success: true,
    message: "Business status updated successfully",
    data: result,
  });
};

export const getBusinessAnalytics = async (req, res) => {
  const result =
    await businessManagementService.getBusinessAnalytics(
      req.params.id,
    );

  return res.status(200).json({
    success: true,
    message: "Business analytics fetched successfully",
    data: result,
  });
};

export const deleteBusiness = async (req, res) => {
  const result =
    await businessManagementService.deleteBusiness(
      req.params.id,
      req.user._id,
    );

  return res.status(200).json({
    success: true,
    message: "Business deactivated successfully",
    data: result,
  });
};