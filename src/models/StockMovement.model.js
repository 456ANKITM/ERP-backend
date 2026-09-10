import mongoose from "mongoose";

const { Schema } = mongoose;

const STOCK_MOVEMENT_TYPES = Object.freeze({
  PURCHASE: "PURCHASE",
  SALE: "SALE",
  ADJUSTMENT: "ADJUSTMENT",
  RETURN: "RETURN",
});

const stockMovementSchema = new Schema(
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

    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
      immutable: true,
      index: true,
    },

    type: {
      type: String,
      enum: {
        values: Object.values(STOCK_MOVEMENT_TYPES),
        message: "Invalid stock movement type",
      },
      required: [true, "Stock movement type is required"],
      immutable: true,
      index: true,
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0.000001, "Quantity must be greater than zero"],
    },

    previousQuantity: {
      type: Number,
      required: [true, "Previous quantity is required"],
      min: 0,
    },

    newQuantity: {
      type: Number,
      required: [true, "New quantity is required"],
      min: 0,
    },

    referenceId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    referenceModel: {
      type: String,
      enum: ["Purchase", "Sale", null],
      default: null,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },
  },
  {
    versionKey: false,
    strict: true,
  },
);

stockMovementSchema.index({
  businessId: 1,
  storeId: 1,
  productId: 1,
  createdAt: -1,
});

stockMovementSchema.index({
  businessId: 1,
  storeId: 1,
  type: 1,
  createdAt: -1,
});

stockMovementSchema.index({
  referenceId: 1,
  referenceModel: 1,
});

stockMovementSchema.statics.TYPES = STOCK_MOVEMENT_TYPES;

const StockMovement = mongoose.model("StockMovement", stockMovementSchema);

export default StockMovement;
