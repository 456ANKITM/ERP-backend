import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 50,
    },
    // Every store belongs to at least one business
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: null,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 255,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

// store code for a particular business will be unique like STORE-01 for Business A and STORE-01 for Business B can happen but STORE-01 for Business A and STORE-01 for Business A again not happen
storeSchema.index({ businessId: 1, code: 1 }, { unique: true });

const Store = mongoose.model("Store", storeSchema);

export default Store;
