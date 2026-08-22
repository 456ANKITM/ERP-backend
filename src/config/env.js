import dotenv from "dotenv";
dotenv.config();

// The Main purpose of this env file is that sometimes our dotenv does not gets loaded and it can cause problems okay so to fix that we are making this file and every env variables are renamed here so that it can never cause that issue

// When we add more env variables then we neeed to list them here as well.
const requiredEnv = ["MONGODB_URI", "PORT"];

// This for each loop iterates over all environment variables from requiredEnv if those are missing in the env file then it will give us error and close the process.
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
});

// This is an export env function where we are doing nothing just reading those env and exporting the variable 
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT),
  MONGODB_URI: process.env.MONGODB_URI,
};
