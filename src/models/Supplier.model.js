import mongoose from "mongoose";

const { Schema } = mongoose;

export const SUPPLIER_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
});

const supplierSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business is required"],
      immutable: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
      minlength: [2, "Supplier name must be at least 2 characters"],
      maxlength: [200, "Supplier name cannot exceed 200 characters"],
    },

    contactPerson: {
      type: String,
      trim: true,
      maxlength: [100, "Contact person cannot exceed 100 characters"],
      default: null,
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

    status: {
      type: String,
      enum: {
        values: Object.values(SUPPLIER_STATUS),
        message: "Invalid supplier status",
      },
      default: SUPPLIER_STATUS.ACTIVE,
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

supplierSchema.index({
  businessId: 1,
  status: 1,
});

supplierSchema.index({
  businessId: 1,
  name: 1,
});

supplierSchema.statics.STATUS = SUPPLIER_STATUS;

const Supplier = mongoose.model("Supplier", supplierSchema);

export default Supplier;
