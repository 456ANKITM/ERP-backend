import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { ALL_ROLES, ROLES } from "@/constants/roles.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: 254,
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ALL_ROLES,
      required: true,
      index: true,
    },
    // Owner: The Business they Own, Store manager: the business their store belongs to super admin always null
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
      index: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Role and Scope Validation
userSchema.pre("validate", function (next) {
  // super admin
  if (this.role === ROLES.SUPER_ADMIN) {
    if (this.businessId || this.storeId) {
      return next(new Error("Super admin can not have businessId or storeId"));
    }
  }

  // store owner
  if (this.role === ROLES.OWNER) {
    if (!this.businessId) {
      return next(new Error("Owners must have a businessId"));
    }

    if (this.storeId) {
      return next(new Error("Owner can not have storeId"));
    }
  }

  // store manager
  if (this.role === ROLES.STORE_MANAGER) {
    if (!this.businessId) {
      return next(new Error("Store manager must have a business Id"));
    }
  }

  next();
});

// Password hashing with bcrypt because we can not have store password in the database

userSchema.pre("save", async function (next) {
  // if password has not changed then do not hash it again and again
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Password Comparison
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
