import mongoose from "mongoose";

const { Schema } = mongoose;

const NOTIFICATION_TYPES = Object.freeze({
  LOW_STOCK: "LOW_STOCK",
  SALE: "SALE",
  PURCHASE: "PURCHASE",
  SYSTEM: "SYSTEM",
});

const notificationSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      default: null,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      immutable: true,
      index: true,
    },

    type: {
      type: String,
      enum: {
        values: Object.values(NOTIFICATION_TYPES),
        message: "Invalid notification type",
      },
      required: [true, "Notification type is required"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: 1000,
    },

    data: {
      type: Schema.Types.Mixed,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
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

notificationSchema.index({
  userId: 1,
  isRead: 1,
  createdAt: -1,
});

notificationSchema.index({
  userId: 1,
  createdAt: -1,
});

notificationSchema.statics.TYPES = NOTIFICATION_TYPES;

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
