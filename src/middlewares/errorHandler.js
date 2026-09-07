import { env } from "@/config/env.js";

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Something went wrong";

  console.error(`[${req.method}] ${req.path} →`, err);

  res.status(statusCode).json({
    success: false,
    message,
    details: err.details || undefined,
    // never leak stack traces in production
    stack: env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export default errorHandler;