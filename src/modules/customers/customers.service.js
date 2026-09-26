import { USER_ROLES } from "@/models/User.model";
import ApiError from "@/utils/ApiError";
import { CUSTOMER_DEFAULTS, CUSTOMER_MESSAGES } from "./customers.constants";
import Store, { STORE_STATUS } from "@/models/Store.model";
import {
  validateCustomerId,
  validateListCustomersQuery,
} from "./customers.validator";
import Customer from "@/models/Customer.model";
import Sale from "@/models/Sale.model";

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

// This escapeRegex functions removes special escape characters used in search term so if user mistakely used some escape characters in the search then we can filter it out here using this function

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// This function determines in which store our user is asssosiated to if user is store manager then they automatically assosiated with their  store and if not then we need bodyStoreId to find out

const resolveWriteStoreId = async ({ user, bodyStoreId }) => {
  if (user.role === USER_ROLES.STORE_MANAGER) {
    return user.storeId;
  }

  if (!bodyStoreId) {
    throw new ApiError(400, CUSTOMER_MESSAGES.STORE_ID_REQUIRED);
  }

  const store = await Store.findOne({
    _id: bodyStoreId,
    businessId: user.businessId,
    deletedAt: null,
    status: STORE_STATUS.ACTIVE,
  });

  if (!store) {
    throw new ApiError(404, CUSTOMER_MESSAGES.STORE_NOT_FOUND);
  }

  return store._id;
};

const resolveReadStoreFilter = (user, queryStoreId) => {
  if (user.role === USER_ROLES.STORE_MANAGER) {
    return user.storeId;
  }
  return queryStoreId || null;
};

// finds the customer

const findScopedCustomer = async ({ user, customerId }) => {
  validateCustomerId(customerId);

  const filter = {
    _id: customerId,
    businessId: user.businessId,
    deletedAt: null,
  };

  if (user.role === USER_ROLES.STORE_MANAGER) {
    filter.storeId = user.storeId;
  }

  const customer = await Customer.findOne(filter);

  if (!customer) {
    throw new ApiError(404, CUSTOMER_MESSAGES.CUSTOMER_NOT_FOUND);
  }

  return customer;
};

// No duplicate  phone or email submission

const assertNoDuplicateContact = async ({
  businessId,
  storeId,
  phone,
  email,
  excludeId,
}) => {
  if (phone) {
    const existingPhone = await Customer.findOne({
      businessId,
      storeId,
      phone,
      deletedAt: null,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });

    if (existingPhone) {
      throw new ApiError(409, CUSTOMER_MESSAGES.PHONE_TAKEN);
    }
  }

  if (email) {
    const existingEmail = await Customer.findOne({
      businessId,
      storeId,
      email,
      deletedAt: null,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });

    if (existingEmail) {
      throw new ApiError(409, CUSTOMER_MESSAGES.EMAIL_TAKEN);
    }
  }
};

export const createCustomer = async ({ user, data }) => {
  const storeId = await resolveWriteStoreId({
    user,
    bodyStoreId: data.storeId,
  });

  await assertNoDuplicateContact({
    businessId: user.businessId,
    storeId,
    phone: data.phone,
    email: data.email,
  });

  const customer = await Customer.create({
    ...data,
    businessId: user.businessId,
    storeId,
    createdBy: user._id,
  });

  return customer.toObject();
};

export const listCustomers = async ({ user, query }) => {
  const {
    page,
    limit,
    status,
    storeId: queryStoreId,
    search,
    sortBy,
    sortOrder,
  } = validateListCustomersQuery(query);

  const storeFilter = resolveReadStoreFilter(user, queryStoreId);

  const skip = (page - 1) * limit;

  const filter = {
    businessId: user.businessId,
    deletedAt: null,
  };

  if (storeFilter) filter.storeId = storeFilter;
  if (status) filter.status = status;

  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { phone: { $regex: safeSearch, $options: "i" } },
      { email: { $regex: safeSearch, $options: "i" } },
    ];
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
  sort._id = sortOrder === "asc" ? 1 : -1;

  const [customers, total] = await Promise.all([
    Customer.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Customer.countDocuments(filter),
  ]);

  return { customers, pagination: buildPagination({ page, limit, total }) };
};

export const getCustomerDetails = async ({ user, customerId }) => {
  const customer = await findScopedCustomer({ user, customerId });

  const saleFilter = {
    businessId: customer.businessId,
    storeId: customer.storeId,
    customerId: customer._id,
  };

  const [purchaseHistory, totalOrders, summaryAgg] = await Promise.all([
    Sale.find(saleFilter)
      .sort({ createdAt: -1 })
      .limit(CUSTOMER_DEFAULTS.PURCHASE_HISTORY_LIMIT)
      .select(
        "invoiceNumber totalAmount amountPaid amountDue paymentStatus status createdAt",
      )
      .lean(),

    Sale.countDocuments(saleFilter),

    Sale.aggregate([
      { $match: saleFilter },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$totalAmount" },
          totalRefunded: { $sum: "$amountRefunded" },
        },
      },
    ]),
  ]);

  const summary = summaryAgg[0] || { totalSpent: 0, totalRefunded: 0 };

  return {
    customer: customer.toObject(),
    purchaseHistory,
    purchaseSummary: {
      totalOrders,
      totalSpent: summary.totalSpent,
      totalRefunded: summary.totalRefunded,
    },
  };
};

export const updateCustomer = async ({ user, customerId, data }) => {
  const customer = await findScopedCustomer({ user, customerId });

  const phoneChanged =
    data.phone !== undefined && data.phone !== customer.phone;
  const emailChanged =
    data.email !== undefined && data.email !== customer.email;

  if (phoneChanged || emailChanged) {
    await assertNoDuplicateContact({
      businessId: customer.businessId,
      storeId: customer.storeId,
      phone: phoneChanged ? data.phone : null,
      email: emailChanged ? data.email : null,
      excludeId: customer._id,
    });
  }

  Object.assign(customer, data);
  customer.updatedBy = user._id;

  await customer.save();

  return customer.toObject();
};
