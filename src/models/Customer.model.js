import mongoose from "mongoose";

const { Schema } = mongoose;

export const CUSTOMER_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
});

const customerSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business is required"],
      immutable: true,
      index: true,
    },

    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store is required"],
      immutable: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      minlength: [2, "Customer name must be at least 2 characters"],
      maxlength: [150, "Customer name cannot exceed 150 characters"],
    },

    phone: {
      type: String,
      trim: true,
      maxlength: [20, "Phone number cannot exceed 20 characters"],
      default: null,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
      default: null,
    },

    address: {
      street: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      city: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      state: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      country: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      postalCode: {
        type: String,
        trim: true,
        maxlength: 20,
        default: null,
      },
    },

    loyaltyPoints: {
      type: Number,
      default: 0,
      min: [0, "Loyalty points cannot be negative"],
    },

    status: {
      type: String,
      enum: {
        values: Object.values(CUSTOMER_STATUS),
        message: "Invalid customer status",
      },
      default: CUSTOMER_STATUS.ACTIVE,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    versionKey: false,
    strict: true,
  },
);

customerSchema.index({
  businessId: 1,
  storeId: 1,
  status: 1,
});

customerSchema.index({
  businessId: 1,
  storeId: 1,
  phone: 1,
});

customerSchema.index({
  businessId: 1,
  storeId: 1,
  email: 1,
});

customerSchema.statics.STATUS = CUSTOMER_STATUS;

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
