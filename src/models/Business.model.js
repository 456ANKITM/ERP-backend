import mongoose from "mongoose";

const { Schema } = mongoose;

const BUSINESS_STATUS = Object.freeze({
  TRIAL: "TRIAL",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  CANCELLED: "CANCELLED",
});

const businessSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      minlength: [2, "Business name must be at least 2 characters"],
      maxlength: [150, "Business can not exceede 150 characters"],
    },
    slug: {
      type: String,
      required: [true, "Business slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [2, "Business Slug must be at least 2 characters"],
      maxlength: [160, "Business Slug can not exceede 160 Characters"],
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid business slug"],
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
      index: true,
    },
    subscriptionPlan: {
      type: String,
      default: "TRIAL",
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(BUSINESS_STATUS),
        message: "Invalid business status",
      },
      default: BUSINESS_STATUS.TRIAL,
      index: true,
    },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: [254, "Contact email can not exceede 254 characters"],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid contact email",
      ],
    },
    contactPhone: {
      type: String,
      trim: true,
      maxlength: [20, "Contact Phone Can not excced more than 20 Char"],
    },
    address: {
      street: {
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
      postalcode: {
        type: String,
        trim: true,
        maxlength: 20,
      },
    },
    taxNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 50,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: [0, "Tax rate cannot be negative"],
      max: [100, "Tax rate cannot exceed 100"],
    },
    logo: {
      type: String,
      trim: true,
      default: null,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: "NPR",
      minlength: 3,
      maxlength: 3,
    },
    timezone: {
      type: String,
      trim: true,
      default: "Asia/Kathmandu",
    },
    fiscalYearStart: {
      type: String,
      trim: true,
      default: "07-16",
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
    versionKey: false,
    strict: true,
    toJSON: {
      transform: (_, ret) => {
        return ret;
      },
    },
  },
);

// Indexes

businessSchema.index({
  ownerId: 1,
  status: 1,
});

businessSchema.index({
  status: 1,
  createdAt: -1,
});

businessSchema.index({
  deletedAt: -1,
});

// Static Constants
businessSchema.statics.STATUS = BUSINESS_STATUS;

const Business = mongoose.model("Business", businessSchema);

export default Business;
