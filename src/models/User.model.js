import mongoose from "mongoose";

const { Schema } = mongoose;

// Object.freeze helps us to make a constant which can not be modified later because our statuses and roles does not need to get modified even by mistake.

const USER_ROLES = Object.freeze({
  SUPER_ADMIN: "SUPER_ADMIN",
  OWNER: "OWNER",
  STORE_MANAGER: "STORE_MANAGER",
});

const USER_STATUS = Object.freeze({
  INVITED: "INVITED",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  DISABLED: "DISABLED",
});

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name can not exccede 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, "Email can not exceede 254 characters"],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      sparse: true, // Useful when we have unique field but optional
      trim: true,
      maxlength: [10, "Phone number can not exceede 20 characters"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: Object.values(USER_ROLES),
        message: "Invalid User role",
      },
      required: [true, "User Role is required"],
      index: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      default: null,
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(USER_STATUS),
        message: "Invalid User Status",
      },
      default: USER_STATUS.INVITED,
      index: true,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    phoneVerifiedAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    avatar: {
      type: String,
      trim: true,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      immutable: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false, // this does not create _v inside document
    strict: true, // remove unknown field while saving the document
    toJSON: {
      transform: (_, ret) => {
        delete ret.passwordHash;
        return ret;
      },
    }, // remove passwordHashin from the JSON response
    toObject: {
      transform: (_, ret) => {
        delete ret.passwordHash;
        return ret;
      },
    }, // does the same to the object
  },
);

// Now we are going to enforce some validation for each 3 users
// SUPER_ADMIN - Does not belongs to the business/store
// OWNER: Must belong to a business and does not directly belong to a store
// STORE MANAGER: Must belong to a business and a store

userSchema.pre("validate", function (next) {
  if (this.role === USER_ROLES.SUPER_ADMIN) {
    this.businessId = null;
    this.storeId = null;
  }

  if (this.role === USER_ROLES.OWNER) {
    if (!this.businessId) {
      return next(new Error("Owner must belong to a business"));
    }

    this.storeId = null;
  }

  if (this.role === USER_ROLES.STORE_MANAGER) {
    if (!this.businessId) {
      return next(new Error("Store manager must belong to a business"));
    }

    if (!this.storeId) {
      return next(new Error("Store manager must belong to a store"));
    }
  }

  next();
});

// Indexes

// Users belong to a business
userSchema.index({
  businessId: 1,
  role: 1,
  status: 1,
});

// Users belongs to a specific store
userSchema.index({
  businessId: 1,
  storeId: 1,
  role: 1,
  status: 1,
});

// Active Users
userSchema.index({
  businessId: 1,
  status: 1,
});

// Soft-deleted Users, should  not normally appear in business Querries
userSchema.index({
  deletedAt: 1,
});

// Static Constants
userSchema.statics.ROLES = USER_ROLES;
userSchema.statics.STATUS = USER_STATUS;

const User = mongoose.model("User", userSchema);

export default User;
