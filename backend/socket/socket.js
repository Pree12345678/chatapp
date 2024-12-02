import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:3000",
            "https://chat-app-vrkz.onrender.com/",
        ],
        methods: ["GET", "POST"],
    },
});

const userSocketMap = {}; // { userId: socketId }

// Utility function to fetch a user's socket ID
export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Handle user ID from the connection
    const userId = socket.handshake.query.userId;
    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;
    } else {
        console.error("Invalid userId detected:", userId);
    }

    // Emit the current list of online users
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Listen for disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        if (userId) {
            delete userSocketMap[userId];
        }
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });

    // Example of a custom event handler
    socket.on("sendMessage", ({ receiverId, message }) => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("receiveMessage", {
                senderId: userId,
                message,
            });
        } else {
            console.log("Receiver is offline.");
        }
    });
});

export { app, io, server };
