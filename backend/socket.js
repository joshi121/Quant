import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    "http://localhost:5173"
];

const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ["GET", "POST"]
    }
});

const userSocketMap = {}; 

io.on("connection", (socket) => {
    console.log(" [BACKEND SUCCESS]: Ek naya user connect hua hai! Socket ID:", socket.id);
    const userId = socket.handshake.query.userId;
    console.log(" [BACKEND ID CHECK]: Query parameters me mili User ID:", userId);
    if (userId) userSocketMap[userId] = socket.id;

    // Send online users list to everyone
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log(" [BACKEND NOTICE]: User disconnect ho gaya, socket ID:", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { app, io, server, userSocketMap };