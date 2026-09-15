import Message from "../models/messagemodel.js";
import bcrpyt from "bcryptjs";
import mongoose from "mongoose";
import { io, userSocketMap } from "../socket.js";
import User from "../models/usermodel.js";

export const sendmessagecontrollor = async (req, res) => {
    try {
        const message = req.body.message;
        const senderId = req.user.id;
        const receiverId = req.params.id;

        if (!message) {
            return res.status(400).json({ message: "Message content cannot be empty" });
        }
        const newMessage = await Message.create({ senderId, receiverId, message });

        // to add the sender and receivers name and email in the message card 

        // const populatedMessage = await newMessage.findById(newMessage._id) 
        //     .populate("senderId", "name email") 
        //     .populate("receiverId", "name email");

        const populatedMessage = await newMessage.populate([
            { path: "senderId", select: "name email" },
            { path: "receiverId", select: "name email" }
        ]);

        const receiverSocketId = userSocketMap[req.params.id];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", populatedMessage);
        }
        return res.status(201).json({ newMessage: populatedMessage });
    } catch (error) {
        console.error("Send message error:", error);
        return res.status(400).json({ message: "Internal server error" });
    }
};

export const getmessagecontrollor = async (req, res) => {
    try {
        const senderId = req.user.id;
        const receiverId = req.params.id;

        const conversation = await Message.find({
            $or: [
                { senderId: senderId, receiverId: receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        }).sort({ createdAt: 1 });

        return res.status(200).json({ conversation });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Global Chat Feed Timeline
export const getGlobalTimelineController = async (req, res) => {
    try {
        const hostId = req.user.id;

        const globalFeed = await Message.find({
            $or: [
                { senderId: hostId },
                { receiverId: hostId }
            ]
        })
        .populate("senderId", "name email")
        .populate("receiverId", "name email")
        .sort({ createdAt: 1 });

        return res.status(200).json(globalFeed);
    } catch (error) {
        console.error("Global timeline fetch error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getRegisteredUsersController = async (req, res) => {
    try {
        const hostId = String(req.user.id );
        console.log("[REGISTERED USERS CONTROLLER] Logged in hostId:", hostId);

        const allUsers = await User.find({id: {$ne : hostId}}).select("-password");
        console.log(`[REGISTERED USERS CONTROLLER] Found ${allUsers.length} other registered users in DB.`);

        return res.status(200).json(allUsers);
    } catch (error) {
        console.error("Users fetch error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Backend Controller: Get Only Today's Messages for Host User
export const getTodaysMessagesController = async (req, res) => {
    try {
        const hostId = req.user.id;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const messages = await Message.find({
            $or: [ { senderId: hostId }, { receiverId: hostId } ],
            createdAt: { $gte: startOfToday, $lte: endOfToday }
        })
        .populate("senderId", "name email")
        .populate("receiverId", "name email")
        .sort({ createdAt: 1 });

        return res.status(200).json(messages);
    } catch (error) {
        console.error("Today's messages fetch error:", error);
        return res.status(500).json({ message: "Error fetching today's messages" });
    }
};