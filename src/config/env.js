import dotenv from "dotenv";
dotenv.config();

// The Main purpose of this env file is that sometimes our dotenv does not gets loaded and it can cause problems okay so to fix that we are making this file and every env variables are renamed here so that it can never cause that issue

// When we add more env variables then we neeed to list them here as well.
const requiredEnv = [
  "MONGODB_URI",
  "PORT",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];

// This for each loop iterates over all environment variables from requiredEnv if those are missing in the env file then it will give us error and close the process.
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
});

const isProduction = process.env.NODE_ENV === "production";

// This is an export env function where we are doing nothing just reading those env and exporting the variable
export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || "development",

  PORT: Number(process.env.PORT),

  MONGODB_URI: process.env.MONGODB_URI,

  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,

  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,

  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",

  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "30d",

  ACCESS_COOKIE_NAME: process.env.ACCESS_COOKIE_NAME || "erp_access_token",

  REFRESH_COOKIE_NAME: process.env.REFRESH_COOKIE_NAME || "erp_refresh_token",

  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,

  COOKIE_SECURE: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === "true"
    : isProduction,

  COOKIE_SAME_SITE:
    process.env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax"),

  PASSWORD_RESET_EXPIRES_MINUTES: Number(
    process.env.PASSWORD_RESET_EXPIRES_MINUTES || 15,
  ),
  INVITE_EXPIRES_HOURS: Number(process.env.INVITE_EXPIRES_HOURS || 72),
});
