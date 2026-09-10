import mongoose from "mongoose";

const { Schema } = mongoose;

const CATEGORY_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
});

const categorySchema = new Schema(
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
      required: [true, "Category name is required"],
      trim: true,
      minlength: [2, "Category name must be at least 2 characters"],
      maxlength: [100, "Catgory name cannot exceede 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceede 500 characters"],
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(CATEGORY_STATUS),
        message: "Invalid Category Status",
      },
      default: CATEGORY_STATUS.ACTIVE,
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
    strict: false,
  },
);

categorySchema.index(
  {
    businessId: 1,
    storeId: 1,
    name: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      deletedAt: null,
    },
  },
);

categorySchema.index({
  businessId: 1,
  storeId: 1,
  status: 1,
});

categorySchema.statics.STATUS = CATEGORY_STATUS;

const Category = mongoose.model("Category", categorySchema);

export default Category;
