import mongoose from "mongoose";

const { Schema } = mongoose;

const PAYMENT_STATUS = Object.freeze({
  UNPAID: "UNPAID",
  PARTIAL: "PARTIAL",
  PAID: "PAID",
});

const PAYMENT_METHOD = Object.freeze({
  CASH: "CASH",
  CARD: "CARD",
  BANK_TRANSFER: "BANK_TRANSFER",
  OTHER: "OTHER",
});

const saleItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0.000001, "Quantity must be greater than zero"],
    },

    sellingPrice: {
      type: Schema.Types.Decimal128,
      required: [true, "Selling price is required"],
      min: 0,
    },

    subtotal: {
      type: Schema.Types.Decimal128,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
    strict: true,
  },
);

const saleSchema = new Schema(
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

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      trim: true,
      uppercase: true,
    },

    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "Sale must contain at least one item",
      },
    },

    subtotal: {
      type: Schema.Types.Decimal128,
      required: true,
      min: 0,
    },

    discount: {
      type: Schema.Types.Decimal128,
      default: 0,
      min: 0,
    },

    tax: {
      type: Schema.Types.Decimal128,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Schema.Types.Decimal128,
      required: true,
      min: 0,
    },

    amountPaid: {
      type: Schema.Types.Decimal128,
      default: 0,
      min: 0,
    },

    amountDue: {
      type: Schema.Types.Decimal128,
      default: 0,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: {
        values: Object.values(PAYMENT_METHOD),
        message: "Invalid payment method",
      },
      default: PAYMENT_METHOD.CASH,
    },

    paymentStatus: {
      type: String,
      enum: {
        values: Object.values(PAYMENT_STATUS),
        message: "Invalid payment status",
      },
      default: PAYMENT_STATUS.PAID,
      index: true,
    },

    soldBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller is required"],
      immutable: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
  },
);

saleSchema.index({
  businessId: 1,
  storeId: 1,
  createdAt: -1,
});

saleSchema.index(
  {
    businessId: 1,
    storeId: 1,
    invoiceNumber: 1,
  },
  {
    unique: true,
  },
);

saleSchema.index({
  businessId: 1,
  customerId: 1,
  createdAt: -1,
});

saleSchema.index({
  businessId: 1,
  storeId: 1,
  paymentStatus: 1,
});

saleSchema.statics.PAYMENT_STATUS = PAYMENT_STATUS;
saleSchema.statics.PAYMENT_METHOD = PAYMENT_METHOD;

const Sale = mongoose.model("Sale", saleSchema);

export default Sale;
