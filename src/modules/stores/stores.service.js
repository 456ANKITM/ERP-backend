import mongoose from "mongoose";
import Store from "@/models/Store.model.js";
import User, { USER_ROLES, USER_STATUS } from "@/models/User.model.js";
import ApiError from "@/utils/ApiError.js";
import { STORE_MESSAGES } from "./stores.constants.js";
import { validateStoreId, validateListStoresQuery } from "./stores.validator.js";

const buildPagination = ({ page, limit, total }) => {
    const totalPages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1

    }
}

// This function is used to escape special characters in a string before using that string inside a Regular Expression (Regex).

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const managerFields = "name email phone role status";

// fetches  a store, scoped to the owner's business, or throws 404. Every Mutating endpoint routes through this so an owner can never touch a store belonging to another business

const findOwnedStore = async (businessId, storeId) => {
    validateStoreId(storeId);

    const store = await Store.findOne({
        _id: storeId,
        businessId,
        deletedAt: null
    })

    if (!store) {
        throw new ApiError(404, STORE_MESSAGES.STORE_NOT_FOUND);
    }

    return store;
}

export const createStore = async ({ businessId, ownerId, data }) => {
    const code = data.code.toUpperCase();
    const existing = await Store.findOne({
        businessId,
        code,
        deletedAt: null,
    });

    if (existing) {
        throw new ApiError(409, STORE_MESSAGES.CODE_TAKEN);
    }
    const store = await Store.create({
        ...data,
        code,
        businessId,
        createdBy: ownerId,
    });

    return store.toObject();

}

export const listStores = async ({ businessId, query }) => {
    const { page, limit, status, search, sortBy, sortOrder } =
        validateListStoresQuery(query);

    const skip = (page - 1) * limit;
    const filter = {
        businessId,
        deletedAt: null,
    };
    if (status) {
        filter.status = status;
    }
    if (search) {
        const safeSearch = escapeRegex(search);
        filter.$or = [
            { name: { $regex: safeSearch, $options: "i" } },
            { code: { $regex: safeSearch, $options: "i" } },
        ];
    }
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
    sort._id = sortOrder === "asc" ? 1 : -1;
    const [stores, total] = await Promise.all([
        Store.find(filter)
            .populate({ path: "storeManagerId", select: managerFields })
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        Store.countDocuments(filter),
    ]);

    return {
        stores,
        pagination: buildPagination({ page, limit, total }),
    };
}

export const getStoreDetails = async ({ businessId, storeId }) => {
    validateStoreId(storeId);
    const store = await Store.findOne({
        _id: storeId,
        businessId,
        deletedAt: null,
    }).populate({ path: "storeManagerId", select: managerFields });
    if (!store) {
        throw new ApiError(404, STORE_MESSAGES.STORE_NOT_FOUND);
    }

    return store.toObject();
}

export const updateStore = async ({ businessId, storeId, ownerId, data }) => {
    const store = await findOwnedStore(businessId, storeId);
    Object.assign(store, data);
    store.updatedBy = ownerId;
    await store.save();

    return store.toObject();
}

export const deactivateStore = async ({ businessId, storeId, ownerId }) => {
    const store = await findOwnedStore(businessId, storeId);
    if (store.status === Store.STATUS.INACTIVE) {
        throw new ApiError(409, STORE_MESSAGES.ALREADY_INACTIVE);
    }
    const previousManagerId = store.storeManagerId;
    store.status = Store.STATUS.INACTIVE;
    store.deletedAt = new Date();
    store.deletedBy = ownerId;
    store.updatedBy = ownerId;
    store.storeManagerId = null;
    await store.save();
    if (previousManagerId) {
        await User.updateOne(
            { _id: previousManagerId, storeId: store._id },
            { $set: { storeId: null } },
        );
    }
    return store.toObject();
}

export const assignManager = async ({businessId, storeId, ownerId, userId}) => {
   const store = await findOwnedStore(businessId, storeId);
    const manager = await User.findOne({
    _id: userId,
    businessId,
    deletedAt: null,
  });
   if (!manager) {
    throw new ApiError(404, STORE_MESSAGES.MANAGER_NOT_FOUND);
  }
   if (manager.role !== USER_ROLES.STORE_MANAGER) {
    throw new ApiError(400, STORE_MESSAGES.MANAGER_INVALID_ROLE);
  }
  if (manager.status !== USER_STATUS.ACTIVE) {
    throw new ApiError(403, STORE_MESSAGES.MANAGER_NOT_ACTIVE);
  }
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async ()=> {
        if(manager.storeId && !manager.storeId.equals(store._id)) {
            await Store.updateOne(
                {_id:manager.storeId, storeManagerId: manager._id}, 
                {$set: {storeManagerId: null}}, 
                {session}
            )
        }

        if (store.storeManagerId && !store.storeManagerId.equals(manager._id)) {
        await User.updateOne(
          { _id: store.storeManagerId, storeId: store._id },
          { $set: { storeId: null } },
          { session },
        );
      }

       manager.storeId = store._id;
      manager.updatedBy = ownerId;
      await manager.save({ session });

       store.storeManagerId = manager._id;
      store.updatedBy = ownerId;
      await store.save({ session });
    })
  } finally {
     await session.endSession();
  }

    return {
    store: store.toObject(),
    manager: manager.toObject(),
  };
}

