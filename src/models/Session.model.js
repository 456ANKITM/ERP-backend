import mongoose from "mongoose";

const { Schema } = mongoose;

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },

    replacedBySessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
      maxlength: 1000,
    },

    ipAddress: {
      type: String,
      default: null,
      maxlength: 100,
    },

    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
  },
);

// Efficient active-session lookup
sessionSchema.index({
  userId: 1,
  revokedAt: 1,
  expiresAt: 1,
});

// Automatically delete expired sessions.
sessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
);

const Session = mongoose.model(
  "Session",
  sessionSchema,
);

export default Session;