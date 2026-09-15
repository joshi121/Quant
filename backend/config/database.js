import mongoose from "mongoose";
import logger from "../utils/logger.js";
import dotenv from "dotenv";

dotenv.config();

// Disable global query buffering so database operations fail instantly if offline
// instead of hanging/buffering for 10 seconds and timing out.
mongoose.set("bufferCommands", false);

// Attach connection event listeners for real-time connection tracking
mongoose.connection.on("connected", () => {
    console.log(" [DB EVENT]: Mongoose connected successfully!");
});

mongoose.connection.on("error", (err) => {
    console.error(" [DB EVENT]: Mongoose connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
    console.warn(" [DB EVENT]: Mongoose disconnected from server.");
});

export const connectToDb = async () => {
    const uris = [
        process.env.MONGO_URI
    ];

    for (const uri of uris) {
        try {
            console.log(`[DB] Attempting connection to: ${uri.substring(0, 35)}...`);
            await mongoose.connect(uri, { 
                serverSelectionTimeoutMS: 4000 // fail fast if server not reachable
            });
            console.log(" Database connected successfully!");
            return true;
        } catch (error) {
            console.error(`[DB ATTEMPT FAILED]:`, error.message);
        }
    }

    logger.error("Critical database connection error occurred - All connection attempts failed.");
    console.error("\n [DATABASE CRITICAL ERROR]: Could not connect to any MongoDB instance.");
    console.error("👉 Please ensure MongoDB service is running locally OR if using MongoDB Atlas, check Network Access IP Whitelist!\n");
    return false;
};