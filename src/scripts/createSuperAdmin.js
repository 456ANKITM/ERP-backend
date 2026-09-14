
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import User, { USER_ROLES, USER_STATUS }  from "../models/User.model.js";
import { connectDB } from "../config/database.js";


const rl = readline.createInterface({
  input,
  output,
});

const ask = async (question) => {
  return (await rl.question(question)).trim();
};

const createSuperAdmin = async () => {
  try {
    console.log("\n=== Create Super Admin ===\n");

    const name = await ask("Name: ");
    const email = await ask("Email: ");
    const password = await ask("Password: ");
    const confirmPassword = await ask("Confirm Password: ");

    if (!name || !email || !password || !confirmPassword) {
      throw new Error("All fields are required.");
    }

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    const normalizedEmail = email.toLowerCase();

    // Check whether this email already exists
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      throw new Error(
        `A user with email "${normalizedEmail}" already exists.`,
      );
    }

    // Check whether a Super Admin already exists
    const existingSuperAdmin = await User.findOne({
      role: USER_ROLES.SUPER_ADMIN,
      deletedAt: null,
    });

    if (existingSuperAdmin) {
      throw new Error(
        "A Super Admin already exists. Create another one only through an authorized admin process.",
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    const superAdmin = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,

      role: USER_ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,

      // Super Admin does not belong to a business or store
      businessId: null,
      storeId: null,

      // First system user
      createdBy: null,
      updatedBy: null,

      // We are creating an already active account
      emailVerifiedAt: new Date(),
    });

    console.log("\nSuper Admin created successfully!");
    console.log("--------------------------------");
    console.log(`ID:    ${superAdmin._id}`);
    console.log(`Name:  ${superAdmin.name}`);
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Role:  ${superAdmin.role}`);
    console.log(`Status: ${superAdmin.status}`);
    console.log("--------------------------------\n");
  } catch (error) {
    console.error("\nFailed to create Super Admin:");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    rl.close();

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
};

const run = async () => {
  await connectDB();
  await createSuperAdmin();
};

run();
