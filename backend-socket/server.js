const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const onlineUsers = new Map(); // userId -> connectionCount

function broadcastOnlineUsers(ioInstance) {
    const users = Array.from(onlineUsers.keys());
    ioInstance.emit("users:online", users);
}

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/signaldesk")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const MessageSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["text", "image", "file"], default: "text" },
  content: { type: String, required: true },
  fileMeta: {
    name: String,
    size: Number,
    mime: String,
    url: String,
  },
  createdAt: { type: Date, default: Date.now },
});

const Message =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  passwordHash: String,
  avatar: String,
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

const GroupSchema = new mongoose.Schema({
  name: String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  description: String,
  isDefault: Boolean,
  isPrivate: Boolean,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

const Group = mongoose.models.Group || mongoose.model("Group", GroupSchema);

const ProjectSchema = new mongoose.Schema({
  name: String,
  projectId: String,
  description: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  accentColor: String,
  createdAt: { type: Date, default: Date.now },
});

const Project =
  mongoose.models.Project || mongoose.model("Project", ProjectSchema);

function verifyToken(token) {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key-change-in-production",
    );
    return decoded;
  } catch (error) {
    return null;
  }
}

io.use(async (socket, next) => {
  console.log(
    `[DEBUG] Incoming connection attempt from ${socket.handshake.address}`,
  );
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      console.log("[DEBUG] Connection rejected: No token");
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log("[DEBUG] Connection rejected: Invalid token");
      return next(new Error("Authentication error: Invalid token"));
    }

    const user = await User.findById(decoded.userId).select("-passwordHash");
    if (!user) {
      console.log("[DEBUG] Connection rejected: User not found");
      return next(new Error("Authentication error: User not found"));
    }

    socket.userId = user._id.toString();
    socket.user = user;

    next();
  } catch (error) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.userId}`);
  
  // Update online status
  const currentCount = onlineUsers.get(socket.userId) || 0;
  onlineUsers.set(socket.userId, currentCount + 1);
  broadcastOnlineUsers(io);

  socket.on("join-project", async ({ projectId }) => {
    try {
      const project = await Project.findById(projectId);

      if (
        !project ||
        !project.members.some((id) => id.toString() === socket.userId)
      ) {
        socket.emit("error", { message: "Not a member of this project" });
        return;
      }

      socket.join(`project:${projectId}`);
      console.log(`User ${socket.userId} joined project ${projectId}`);
    } catch (error) {
      console.error("Join project error:", error);
      socket.emit("error", { message: "Failed to join project" });
    }
  });

  socket.on("leave-project", ({ projectId }) => {
    socket.leave(`project:${projectId}`);
    console.log(`User ${socket.userId} left project ${projectId}`);
  });

  socket.on("join-group", async ({ groupId }) => {
    console.log(
      `[DEBUG] User ${socket.userId} attempting to join group ${groupId}`,
    );
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        socket.emit("error", { message: "Group not found" });
        return;
      }

      const project = await Project.findById(group.project);
      if (
        !project ||
        !project.members.some((id) => id.toString() === socket.userId)
      ) {
        console.log(
          `[DEBUG] User ${socket.userId} failed project membership check for group ${groupId}`,
        );
        socket.emit("error", { message: "Not a member of this project" });
        return;
      }

      if (
        group.isPrivate &&
        !group.members.some((id) => id.toString() === socket.userId)
      ) {
        console.log(
          `[DEBUG] User ${socket.userId} failed private channel check for group ${groupId}`,
        );
        socket.emit("error", {
          message: "Not a member of this private channel",
        });
        return;
      }

      socket.join(`group:${groupId}`);
      console.log(`User ${socket.userId} joined group ${groupId}`);
    } catch (error) {
      console.error("Join group error:", error);
      socket.emit("error", { message: "Failed to join group" });
    }
  });

  socket.on("leave-group", ({ groupId }) => {
    socket.leave(`group:${groupId}`);
    console.log(`User ${socket.userId} left group ${groupId}`);
  });

  socket.on("send-message", async (data) => {
    console.log(
      `[DEBUG] User ${socket.userId} sending message to group ${data.groupId}`,
      data,
    );
    try {
      const { groupId, content, type, fileUrl, fileName, fileSize } = data;

      const group = await Group.findById(groupId);
      if (!group) {
        socket.emit("error", { message: "Group not found" });
        return;
      }

      const project = await Project.findById(group.project);
      if (
        !project ||
        !project.members.some((id) => id.toString() === socket.userId)
      ) {
        socket.emit("error", { message: "Not authorized" });
        return;
      }

      if (
        group.isPrivate &&
        !group.members.some((id) => id.toString() === socket.userId)
      ) {
        socket.emit("error", {
          message: "Not a member of this private channel",
        });
        return;
      }

      const messageData = {
        group: groupId,
        sender: socket.userId,
        type: type || "text",
        content: content || "",
      };

      if (fileUrl) {
        messageData.fileMeta = {
          url: fileUrl,
          name: fileName,
          size: fileSize,
        };
      }

      const message = await Message.create(messageData);
      const populatedMessage = await Message.findById(message._id).populate(
        "sender",
        "name email avatar",
      );

      const messageResponse = {
        _id: populatedMessage._id.toString(),
        groupId: populatedMessage.group.toString(),
        userId: populatedMessage.sender._id.toString(),
        userName: populatedMessage.sender.name,
        userAvatar: populatedMessage.sender.avatar,
        content: populatedMessage.content,
        type: populatedMessage.type,
        fileUrl: populatedMessage.fileMeta?.url,
        fileName: populatedMessage.fileMeta?.name,
        fileSize: populatedMessage.fileMeta?.size,
        createdAt: populatedMessage.createdAt,
      };

      const roomSize =
        io.sockets.adapter.rooms.get(`group:${groupId}`)?.size || 0;
      console.log(
        `[DEBUG] Broadcasting message to group:${groupId}. Room size: ${roomSize}`,
      );
      io.to(`group:${groupId}`).emit("new-message", messageResponse);

      console.log(`Message sent to group ${groupId} by user ${socket.userId}`);
    } catch (error) {
      console.error("Send message error:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("typing", ({ groupId, isTyping }) => {
    socket.to(`group:${groupId}`).emit("user-typing", {
      groupId,
      userId: socket.userId,
      isTyping,
    });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.userId}`);
    if (socket.userId) {
        const count = onlineUsers.get(socket.userId) || 0;
        if (count <= 1) {
            onlineUsers.delete(socket.userId);
        } else {
            onlineUsers.set(socket.userId, count - 1);
        }
        broadcastOnlineUsers(io);
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Socket.io server running" });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
