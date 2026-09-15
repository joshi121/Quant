import express from "express";
import dotenv from "dotenv";//to load env files 
dotenv.config(); //function to load key value pairs in process.env file 

import cookieParser from "cookie-parser";
import { connectToDb } from "./config/database.js";
import Router from "./routes/userRoutes.js";
import logger from "./utils/logger.js";
import msgRouter from "./routes/MessageRoutes.js";
import { app, server } from "./socket.js";
import cors from "cors";

import newsRoutes from "./routes/newsRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import { fetchAndStoreNews } from "./controllers/newsControllor.js";

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL
].filter(Boolean);

const isOriginAllowed = (origin) => {
    if (!origin) return true;
    if (allowedOrigins.includes(origin)) return true;
    if (origin.endsWith(".vercel.app") || origin.endsWith(".onrender.com")) return true;
    return false;
};

app.use(cors({
    origin: function (origin, callback) {
        if (isOriginAllowed(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Not allowed by CORS: ${origin}`));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
}));

app.use(express.json()); 
app.use(cookieParser());
app.use("/api/chatapp/user", Router);
app.use("/api/messages", msgRouter);
app.use("/api/news", newsRoutes);
app.use("/api/stock", stockRoutes);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    // 1. Await MongoDB Connection FIRST
    const isConnected = await connectToDb();

    // 2. Start HTTP & Socket Server
    server.listen(PORT, async () => {
        console.log(` Server running on port ${PORT}`);

        if (isConnected) {
            console.log(" [NEWS INGESTION]: Initializing past 24-hour news feed...");
            try {
                await fetchAndStoreNews();
            } catch (e) {
                console.error("Initial news ingestion warning:", e.message);
            }

            // Schedule background news sync every 1 minute
            setInterval(async () => {
                try {
                    await fetchAndStoreNews();
                } catch (e) {
                    console.error("Background news sync warning:", e.message);
                }
            }, 1 * 60 * 1000);
        } else {
            console.warn("⚠️ [SERVER WARNING]: Started server without active MongoDB connection. Start MongoDB to resume news feed.");
        }
    });
};

startServer();