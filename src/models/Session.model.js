import mongoose from "mongoose";

const { Schema } = mongoose;

const SESSION_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  REVOKED: "REVOKED",
  EXPIRED: "EXPIRED",
});

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      immutable: true,
      index: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      default: null,
      immutable: true,
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      default: null,
      immutable: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: [true, "Refresh token hash is required"],
      select: false,
    },
    tokenFamily: {
      type: String,
      required: [true, "Token family is required"],
      immutable: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(SESSION_STATUS),
        message: "Invalid Session Status",
      },
      default: SESSION_STATUS.ACTIVE,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, "Session expiration date is required"],
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokeReason: {
      type: String,
      maxlength: 100,
      trim: true,
      default: null,
    },
    ipAdress: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    strict: true,
  },
);

// Indexes

// Find all sesions belonging to a user
sessionSchema.index({
  userId: 1,
  status: 1,
  createdAt: -1,
});

// Find active session for a business
sessionSchema.index({
  businessId: 1,
  status: 1,
});

// Token family is used for refresh-token rotation/reuse detection
sessionSchema.index({
  tokenFamily: 1,
  status: 1,
});

// Automatically remove expired sessions from mongoDB
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Middleware

sessionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Static Constant
sessionSchema.statics.STATUS = SESSION_STATUS;

const Session = mongoose.model("Session", sessionSchema);

export default Session;
