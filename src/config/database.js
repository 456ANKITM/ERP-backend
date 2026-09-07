import mongoose from "mongoose"; 
import {env} from "@/config/env.js"


// Database connection Function 
const connectDB = async () => {
    try {
        const connection = await mongoose.connect(env.MONGODB_URI, {
            // Wait for 5 Second if not connected by then then stop the process
            serverSelectionTimeoutMS:5000,  
            // creates 10 connection from our application to the database
            maxPoolSize:10
        });
        console.log(`MongoDB Connected: ${connection.connection.host}`);
        // After connecting, if any error happens then this event runs on
        mongoose.connection.on("error", (error)=>{
            console.error("MongoDB Runtime error:", error.message)
        });
        // and this event closes the connection
        mongoose.connection.on("disconnected",()=>{
            console.warn("MongoDB Disconnected")
        });
    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);
        process.exit(1)
    }
}


// Database disconnection function - It is used when we need to do finish our some operations before closing the database connection
const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        console.log("MongoDB Connection lost")
    } catch (error) {
        console.error("MongoDB Close error:", error.message)
    }
}

export {
    connectDB, 
    disconnectDB
}