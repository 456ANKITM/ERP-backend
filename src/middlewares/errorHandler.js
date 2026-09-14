import { env } from "@/config/env.js";

const errorHandler = (
  err,
  req,
  res,
  next,
) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error(
    `[${req.method}] ${req.originalUrl}`,
    err,
  );

  let statusCode =
    err.statusCode || 500;

  let message = err.isOperational
    ? err.message
    : "Something went wrong";

  let details =
    err.isOperational
      ? err.details
      : undefined;

  // Mongo duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    message =
      "A resource with the provided unique value already exists";
    details = undefined;
  }

  // Mongoose validation
  if (
    err.name ===
    "ValidationError"
  ) {
    statusCode = 400;
    message = "Validation failed";

    details = Object.values(
      err.errors,
    ).map((error) => ({
      field: error.path,
      message: error.message,
    }));
  }

  // Invalid ObjectId
  if (
    err.name ===
    "CastError"
  ) {
    statusCode = 400;
    message = "Invalid resource identifier";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details
      ? { details }
      : {}),
    ...(env.NODE_ENV ===
    "development"
      ? { stack: err.stack }
      : {}),
  });
};

export default errorHandler;