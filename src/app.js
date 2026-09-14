import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoSanitize from "@exortek/express-mongo-sanitize";
import morgan from "morgan";
import { env } from "@/config/env.js";
import errorHandler from "@/middlewares/errorHandler.js";
import authRoutes from "@/modules/auth/auth.routes.js";
import businessManagementRoutes from "@/modules/businessManagement/business-management.routes.js";

const app = express();

app.disable("x-powered-by");

// This middleware logs the requests
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);

// Parses every request to be json
app.use(
  express.json({
    limit: "1mb",
  }),
);

// This Middleware allows our server to read data sent from HTML forms, It parses incomming request bodies and put the data inside req.body
app.use(express.urlencoded({ extended: true }));

// This middleware parses the cookies if sent from the frontend
app.use(cookieParser());

app.use(helmet());

// This package is used to sanitize the request data comming from the frontend after parsed into JSON
app.use(
  mongoSanitize({
    replaceWith: "_",
    onSanitize: ({ req, key }) => {
      console.warn(
        `Sanitized potentially malicious key "${key}" in request to ${req.path}`,
      );
    },
  }),
);

// Routes

// Test Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "ERP API Running",
  });
});

// Routes
app.use("/auth", authRoutes);
app.use("/businesses", businessManagementRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

export default app;
