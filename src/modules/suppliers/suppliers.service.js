import Supplier, { SUPPLIER_STATUS } from "@/models/Supplier.model";
import {
  validateListSuppliersQuerry,
  validateSupplierId,
} from "./suppliers.validators";
import ApiError from "@/utils/ApiError";
import { SUPPLIER_DEFAULTS, SUPPLIER_MESSAGES } from "./suppliers.constants";
import { USER_ROLES } from "@/models/User.model";
import Purchase from "@/models/Purchase.model";

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

const findScopedSupplier = async ({ user, supplierId }) => {
  validateSupplierId(supplierId);

  const supplier = await Supplier.findOne({
    _id: supplierId,
    businessId: user.businessId,
    deletedAt: null,
  });

  if (!supplier) {
    throw new ApiError(404, SUPPLIER_MESSAGES.SUPPLIER_NOT_FOUND);
  }

  return supplier;
};

export const createSupplier = async ({ user, data }) => {
  const existing = await Supplier.findOne({
    businessId: user.businessId,
    name: data.name,
    deletedAt: null,
  });

  if (existing) {
    throw new ApiError(409, SUPPLIER_MESSAGES.NAME_TAKEN);
  }

  const supplier = await Supplier.create({
    ...data,
    businessId: user.businessId,
    createdBy: user._id,
  });

  return supplier.toObject();
};

export const listSuppliers = async ({ user, query }) => {
  const { page, limit, status, search, sortBy, sortOrder } =
    validateListSuppliersQuerry(query);
  const skip = (page - 1) * limit;
  const filter = {
    businessId: user.businessId,
    deletedAt: null,
  };
  if (status) filter.status = status;

  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { contactPerson: { $regex: safeSearch, $options: "i" } },
      { phone: { $regex: safeSearch, $options: "i" } },
    ];
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
  sort._id = sortOrder === "asc" ? 1 : -1;

  const [suppliers, total] = await Promise.all([
    Supplier.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Supplier.countDocuments(filter),
  ]);
  return { suppliers, pagination: buildPagination({ page, limit, total }) };
};

export const getSupplierDetails = async ({ user, supplierId }) => {
  const supplier = await findScopedSupplier({ user, supplierId });
  const purchaseFilter = {
    businessId: user.businessId,
    supplierId: supplier._id,
  };
  if (user.role === USER_ROLES.STORE_MANAGER) {
    purchaseFilter.storeId = user.storeId;
  }
  const [purchaseHistory, totalPurchase, totalAmountAgg] = await Promise.all([
    Purchase.find(purchaseFilter)
      .sort({ purchaseDate: -1 })
      .limit(SUPPLIER_DEFAULTS.PURCHASE_HISTORY_LIMIT)
      .select(
        "purchaseNumber storeId totalAmount amountPaid amountDue paymentStatus purchaseDate",
      )
      .populate({ path: "storeId", select: "name code" })
      .lean(),

    Purchase.countDocuments(purchaseFilter),
    Purchase.aggregate([
      { $match: purchaseFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          totalDue: { $sum: "$amountDue" },
        },
      },
    ]),
  ]);
  const summary = totalAmountAgg[0] || { totalAmount: 0, totalDue: 0 };
  return {
    supplier: supplier.toObject(),
    purchaseHistory,
    purchaseSummary: {
      totalPurchase,
      totalAmount: summary.totalAmount,
      totalDue: summary.totalDue,
    },
  };
};

export const updateSupplier = async ({ user, supplierId, data }) => {
  const supplier = await findScopedSupplier({ user, supplierId });

  if (data.name && data.name !== supplier.name) {
    const existing = await Supplier.findOne({
      businessId: user.businessId,
      name: data.name,
      deletedAt: null,
      _id: { $ne: supplier._id },
    });
    if (existing) {
      throw new ApiError(409, SUPPLIER_MESSAGES.NAME_TAKEN);
    }
  }
  Object.assign(supplier, data);
  supplier.updatedBy = user._id;
  await supplier.save();
  return supplier.toObject();
};

export const removeSupplier = async ({ user, supplierId }) => {
  const supplier = await findScopedSupplier({ user, supplierId });
  if (supplier.status === SUPPLIER_STATUS.INACTIVE) {
    throw new ApiError(409, SUPPLIER_MESSAGES.ALREADY_INACTIVE);
  }
  supplier.status = SUPPLIER_STATUS.INACTIVE;
  supplier.deletedAt = new Date();
  supplier.deletedBy = user._id;
  supplier.updatedBy = user._id;

  await supplier.save();

  return supplier.toObject();
};
