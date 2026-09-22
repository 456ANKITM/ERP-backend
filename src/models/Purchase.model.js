import mongoose from "mongoose";

const { Schema } = mongoose;

export const PAYMENT_STATUS = Object.freeze({
  UNPAID: "UNPAID",
  PARTIAL: "PARTIAL",
  PAID: "PAID",
});

export const PURCHASE_RECORD_STATUS = Object.freeze({
  RECORDED: "RECORDED",
  CANCELLED: "CANCELLED",
});

const purchaseItemSchema = new Schema(
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

    costPrice: {
      type: Schema.Types.Decimal128,
      required: [true, "Cost price is required"],
      min: [0, "Cost price cannot be negative"],
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

const purchaseSchema = new Schema(
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

    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Supplier is required"],
      immutable: true,
      index: true,
    },

    purchaseNumber: {
      type: String,
      required: [true, "Purchase number is required"],
      trim: true,
      uppercase: true,
    },

    items: {
      type: [purchaseItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "Purchase must contain at least one item",
      },
    },

    
    status: {
  type: String,
  enum: {
    values: Object.values(PURCHASE_RECORD_STATUS),
    message: "Invalid purchase status",
  },
  default: PURCHASE_RECORD_STATUS.RECORDED,
  index: true,
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

    paymentStatus: {
      type: String,
      enum: {
        values: Object.values(PAYMENT_STATUS),
        message: "Invalid payment status",
      },
      default: PAYMENT_STATUS.UNPAID,
      index: true,
    },

    purchaseDate: {
      type: Date,
      required: [true, "Purchase date is required"],
      default: Date.now,
      index: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
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
    cancelledAt: {
  type: Date,
  default: null,
},
cancelledBy: {
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

purchaseSchema.index({
  businessId: 1,
  storeId: 1,
  purchaseDate: -1,
});

purchaseSchema.index(
  {
    businessId: 1,
    storeId: 1,
    purchaseNumber: 1,
  },
  {
    unique: true,
  },
);

purchaseSchema.index({
  businessId: 1,
  supplierId: 1,
  purchaseDate: -1,
});

purchaseSchema.index({
  businessId: 1,
  storeId: 1,
  paymentStatus: 1,
});

purchaseSchema.statics.PAYMENT_STATUS = PAYMENT_STATUS;
purchaseSchema.statics.RECORD_STATUS = PURCHASE_RECORD_STATUS;

const Purchase = mongoose.model("Purchase", purchaseSchema);

export default Purchase;
