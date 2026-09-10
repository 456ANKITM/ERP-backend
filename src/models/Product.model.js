import mongoose from "mongoose";

const { Schema } = mongoose;

const PRODUCT_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
});

const productSchema = new Schema(
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
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Prodcut name is required"],
      trim: true,
      minlength: [2, "Product should must be at least 2 characters"],
      maxlength: [200, "Product name can not exceede 200 Characters"],
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
      maxlength: [100, "SKU Can not exceede 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description Can not exceede 2000 characters"],
      default: null,
    },
    unit: {
      type: String,
      required: [true, "Product Unit is required"],
      trim: true,
      lowercase: true,
      maxlength: 30,
    },
    costPrice: {
      type: Schema.Types.Decimal128,
      required: [true, "Cost Price is required"],
      min: [0, "Cost Price Can not be negative"],
    },
    sellingPrice: {
      type: Schema.Types.Decimal128,
      required: [true, "Selling Price is required"],
      min: [0, "Selling Price can not be negative"],
    },
    quantityInStock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Quantity in Stock Can not be negative"],
    },
    recorderLevel: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Recorder Level Can not be negative"],
    },
    images: {
      type: [
        {
          url: {
            type: String,
            required: true,
            trim: true,
          },
          alt: {
            type: String,
            trim: true,
            maxlength: 200,
            default: null,
          },
        },
      ],
      default: [],
    },
    barcode: {
      type: String,
      trim: true,
      default: null,
      maxlength: 100,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(PRODUCT_STATUS),
        message: "Invalid product Status",
      },
      default: PRODUCT_STATUS.ACTIVE,
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

productSchema.index(
  {
    businessId: 1,
    storeId: 1,
    sku: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      deletedAt: null,
    },
  },
);

productSchema.index(
  {
    businessId: 1,
    storeId: 1,
    barcode: 1,
  },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      deletedAt: null,
    },
  },
);

productSchema.index({
  businessId: 1,
  storeId: 1,
  status: 1,
});

productSchema.index({
  businessId: 1,
  storeId: 1,
  categoryId: 1,
});

productSchema.index({
  businessId: 1,
  storeId: 1,
  quantityInStock: 1,
});

// Static Constant

productSchema.statics.STATUS = PRODUCT_STATUS;
const Product = mongoose.model("Product", productSchema);

export default Product;
