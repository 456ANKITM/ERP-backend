import Business from "@/models/Business.model.js";
import Store from "@/models/Store.model.js";
import User from "@/models/User.model.js";
import Product from "@/models/Product.model.js";
import Category from "@/models/Category.model.js";
import Customer from "@/models/Customer.model.js";
import Supplier from "@/models/Supplier.model.js";
import Sale from "@/models/Sale.model.js";
import Purchase from "@/models/Purchase.model.js";
import StockMovement from "@/models/StockMovement.model.js";
import Notification from "@/models/Notification.model.js";

import ApiError from "@/utils/ApiError.js";

import {
  BUSINESS_MANAGEMENT_MESSAGES,
} from "./business-management.constants.js";

import {
  validateBusinessId,
  validateListBusinessesQuery,
  validateBusinessStatusBody,
} from "./business-management.validator.js";

const buildPagination = ({
  page,
  limit,
  total,
}) => {
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

const escapeRegex = (value) => {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
};

const buildActiveBusinessFilter = () => ({
  deletedAt: null,
  status: {
    $ne: Business.STATUS.CANCELLED,
  },
});

export const listBusinesses = async (query) => {
  const {
    page,
    limit,
    status,
    search,
    sortBy,
    sortOrder,
  } = validateListBusinessesQuery(query);

  const skip = (page - 1) * limit;

  const filter = buildActiveBusinessFilter();

  if (status) {
    filter.status = status;
  }

  if (search) {
    const safeSearch = escapeRegex(search);

    filter.$or = [
      {
        name: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        slug: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        contactEmail: {
          $regex: safeSearch,
          $options: "i",
        },
      },
    ];
  }

  const sort = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  // Always add _id as a deterministic secondary sort.
  sort._id = sortOrder === "asc" ? 1 : -1;

  const [businesses, total] = await Promise.all([
    Business.find(filter)
      .select(
        [
          "name",
          "slug",
          "ownerId",
          "subscriptionId",
          "subscriptionPlan",
          "status",
          "contactEmail",
          "contactPhone",
          "logo",
          "currency",
          "timezone",
          "createdAt",
          "updatedAt",
        ].join(" "),
      )
      .populate({
        path: "ownerId",
        select: "name email role status",
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

    Business.countDocuments(filter),
  ]);

  return {
    businesses,
    pagination: buildPagination({
      page,
      limit,
      total,
    }),
  };
};

export const getBusinessDetails = async (businessId) => {
  validateBusinessId(businessId);

  const business = await Business.findOne({
    _id: businessId,
    ...buildActiveBusinessFilter(),
  })
    .select(
      [
        "name",
        "slug",
        "ownerId",
        "subscriptionId",
        "subscriptionPlan",
        "status",
        "contactEmail",
        "contactPhone",
        "address",
        "taxNumber",
        "logo",
        "currency",
        "timezone",
        "fiscalYearStart",
        "createdBy",
        "updatedBy",
        "createdAt",
        "updatedAt",
      ].join(" "),
    )
    .populate({
      path: "ownerId",
      select:
        "name email phone role status createdAt lastLoginAt",
    })
    .populate({
      path: "createdBy",
      select: "name email role",
    })
    .populate({
      path: "updatedBy",
      select: "name email role",
    })
    .lean();

  if (!business) {
    throw new ApiError(
      404,
      BUSINESS_MANAGEMENT_MESSAGES.BUSINESS_NOT_FOUND,
    );
  }

  const stores = await Store.find({
    businessId,
    deletedAt: null,
  })
    .select(
      [
        "name",
        "slug",
        "code",
        "status",
        "address",
        "phone",
        "email",
        "createdAt",
        "updatedAt",
      ].join(" "),
    )
    .sort({
      createdAt: -1,
      _id: -1,
    })
    .lean();

  return {
    business,
    stores,
  };
};

export const updateBusinessStatus = async (
  businessId,
  body,
  adminUserId,
) => {
  validateBusinessId(businessId);

  const { status } = validateBusinessStatusBody(body);

  const business = await Business.findOne({
    _id: businessId,
    deletedAt: null,
  });

  if (!business) {
    throw new ApiError(
      404,
      BUSINESS_MANAGEMENT_MESSAGES.BUSINESS_NOT_FOUND,
    );
  }

  if (business.status === Business.STATUS.CANCELLED) {
    throw new ApiError(
      409,
      BUSINESS_MANAGEMENT_MESSAGES.CANCELLED_BUSINESS,
    );
  }

  const previousStatus = business.status;

  business.status = status;
  business.updatedBy = adminUserId;

  await business.save();

  return {
    business: {
      id: business._id,
      name: business.name,
      status: business.status,
      updatedAt: business.updatedAt,
    },
    previousStatus,
  };
};

export const getBusinessAnalytics = async (businessId) => {
  validateBusinessId(businessId);

  const business = await Business.findOne({
    _id: businessId,
    ...buildActiveBusinessFilter(),
  })
    .select(
      "name slug status subscriptionPlan createdAt",
    )
    .lean();

  if (!business) {
    throw new ApiError(
      404,
      BUSINESS_MANAGEMENT_MESSAGES.BUSINESS_NOT_FOUND,
    );
  }


  const [
    totalUsers,
    activeUsers,
    totalStores,
    totalProducts,
    totalCategories,
    totalCustomers,
    totalSuppliers,
    totalSales,
    totalPurchases,
    totalStockMovements,
    totalNotifications,
  ] = await Promise.all([
    User.countDocuments({
      businessId,
    }),

    User.countDocuments({
      businessId,
      status: "ACTIVE",
    }),

    Store.countDocuments({
      businessId,
      deletedAt: null,
    }),

    Product.countDocuments({
      businessId,
    }),

    Category.countDocuments({
      businessId,
    }),

    Customer.countDocuments({
      businessId,
    }),

    Supplier.countDocuments({
      businessId,
    }),

    Sale.countDocuments({
      businessId,
    }),

    Purchase.countDocuments({
      businessId,
    }),

    StockMovement.countDocuments({
      businessId,
    }),

    Notification.countDocuments({
      businessId,
    }),
  ]);

  return {
    business: {
      id: business._id,
      name: business.name,
      slug: business.slug,
      status: business.status,
      subscriptionPlan: business.subscriptionPlan,
      createdAt: business.createdAt,
    },

    usage: {
      users: {
        total: totalUsers,
        active: activeUsers,
      },

      stores: {
        total: totalStores,
      },

      products: {
        total: totalProducts,
      },

      categories: {
        total: totalCategories,
      },

      customers: {
        total: totalCustomers,
      },

      suppliers: {
        total: totalSuppliers,
      },

      sales: {
        total: totalSales,
      },

      purchases: {
        total: totalPurchases,
      },

      stockMovements: {
        total: totalStockMovements,
      },

      notifications: {
        total: totalNotifications,
      },
    },
  };
};

export const deleteBusiness = async (
  businessId,
  adminUserId,
) => {
  validateBusinessId(businessId);

  const business = await Business.findOne({
    _id: businessId,
    deletedAt: null,
  });

  if (!business) {
    throw new ApiError(
      404,
      BUSINESS_MANAGEMENT_MESSAGES.BUSINESS_NOT_FOUND,
    );
  }

  if (business.status === Business.STATUS.CANCELLED) {
    throw new ApiError(
      409,
      "Business is already cancelled",
    );
  }

  business.status = Business.STATUS.CANCELLED;
  business.deletedAt = new Date();
  business.deletedBy = adminUserId;
  business.updatedBy = adminUserId;

  await business.save();

  return {
    id: business._id,
    name: business.name,
    status: business.status,
    deletedAt: business.deletedAt,
    deletedBy: business.deletedBy,
  };
};