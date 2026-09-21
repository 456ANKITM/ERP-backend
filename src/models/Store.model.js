import mongoose from "mongoose";

const { Schema } = mongoose;

export const STORE_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
});

const storeSchema = new Schema(
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
      required: [true, "Store name is required"],
      trim: true,
      minlength: [2, "Store name must be at least 2 characters"],
      maxlength: [150, "Store name can not exceede 150 characters"],
    },
    code: {
      type: String,
      required: [true, "Store Code is required"],
      trim: true,
      uppercase: true,
      minlength: [2, "Store code must be at least 2 characters"],
      maxlength: [30, "Store Code can not exceede more than 30 characters"],
      match: [
        /^[A-Z0-9_-]+$/,
        "Store code can only contain letters, numbers, hyphens and underscores",
      ],
    },
    location: {
      address: {
        type: String,
        trim: true,
        maxlength: 200,
      },
      city: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      state: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      country: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "Nepal",
      },
      postalCode: {
        type: String,
        trim: true,
        maxlength: 20,
      },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: {
          type: [Number],
        },
      },
    },
    storeManagerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    contactPhone: {
      type: String,
      trim: true,
      maxlength: [20, "Contact Phone Can not exceede 20 characters"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [254, "Email Cannot exceede 254 characters"],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(STORE_STATUS),
        message: "Invalid store status",
      },
      default: STORE_STATUS.ACTIVE,
    },
    openingHours: {
      monday: {
        open: String,
        close: String,
      },
      tuesday: {
        open: String,
        close: String,
      },
      wednesday: {
        open: String,
        close: String,
      },
      thursday: {
        open: String,
        close: String,
      },
      friday: {
        open: String,
        close: String,
      },
      saturday: {
        open: String,
        close: String,
      },
      sunday: {
        open: String,
        close: String,
      },
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
    strict: false,
  },
);

// Geosptial index
storeSchema.index({
  "location.coordinates": "2dsphere",
});

// Tenant indexes

// Most important Store index
storeSchema.index({
  businessId: 1,
  status: 1,
});

// Store code must only  be unique within a business

storeSchema.index(
  {
    businessId: 1,
    code: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      deletedAt: null,
    },
  },
);

storeSchema.index({
  businessId: 1,
  storeManagerId: 1,
});

storeSchema.index({
  deletedAt: 1,
});

// Static Constant
storeSchema.statics.STATUS = STORE_STATUS;

const Store = mongoose.model("Store", storeSchema);

export default Store;
