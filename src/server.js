import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/database.js";

const startServer = async () => {
  // first connect database without connecting it do not start our server
  await connectDB();
  const server = app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });

  process.on("SIGTERM", async () => {
    console.log("SIGTERM received");
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  });

  process.on("SIGINT", async () => {
    console.log("Server Shutting down...");
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  });
};

startServer();
