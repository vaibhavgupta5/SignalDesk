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

// AI Logic Configuration
const axios = require("axios");
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const groupQueues = new Map(); // groupId -> { messages: [], charCount: 0, isProcessing: false }

async function processAIQueue(groupId) {
  if (mongoose.connection.readyState !== 1) {
    console.warn(
      `[AI] Skipping queue processing for group ${groupId}: MongoDB not connected.`,
    );
    return;
  }
  const queue = groupQueues.get(groupId);
  if (!queue || queue.isProcessing || queue.messages.length === 0) return;

  try {
    queue.isProcessing = true;
    console.log(
      `[AI] Processing queue for group ${groupId}: ${queue.messages.length} messages, ${queue.charCount} chars`,
    );

    const payload = {
      messages: queue.messages.map((m) => ({
        user: m.user,
        message: m.message,
        timestamp: m.timestamp,
        metadata: { id: m.id, userId: m.userId },
      })),
    };

    const response = await axios.post(`${AI_SERVICE_URL}/ai/classify`, payload);
    const classifiedData = response.data;

    if (classifiedData && classifiedData.messages) {
      let savedCount = 0;
      for (const classified of classifiedData.messages) {
        const types = classified.type || [];
        const messageId = classified.metadata?.id;
        const userId = classified.metadata?.userId;

        console.log(
          `[AI Debug] Message: "${classified.message.slice(0, 30)}..." | LLM Types: [${types.join(", ")}]`,
        );

        // Ensure we match regardless of case from LLM
        const categories = types.filter((t) =>
          [
            "DECISION",
            "ACTION",
            "ASSUMPTION",
            "SUGGESTION",
            "CONSTRAINT",
            "QUESTION",
          ].includes(t.toUpperCase()),
        );

        if (categories.length > 0 && messageId) {
          // Save to separate Context collection as requested
          await Context.create({
            messageId,
            groupId,
            userId: userId,
            content: classified.message,
            category: categories.map((c) => c.toUpperCase()),
            confidence: {
              score: classified.confidence?.score || 1,
              reason: classified.confidence?.reason || "",
            },
            classifiedAt: new Date(),
          });

          console.log(
            `[AI] [MongoDB] Saved context for message ${messageId}: ${categories.join(", ")}`,
          );
          savedCount++;
        }
      }

      if (savedCount > 0) {
        console.log(
          `[AI] Successfully saved ${savedCount} context items in group ${groupId}`,
        );
        io.to(`group:${groupId}`).emit("signals-updated", {
          groupId,
          count: savedCount,
          message: `${savedCount} context signals identified by AI`,
        });
      } else {
        console.log(
          `[AI] Processed ${classifiedData.messages.length} messages but found no relevant signals in target categories.`,
        );
      }
    }

    // Clear queue after processing
    groupQueues.set(groupId, {
      messages: [],
      charCount: 0,
      isProcessing: false,
    });
    console.log(`[AI] Queue cleared for group ${groupId}`);
  } catch (error) {
    console.error(
      `[AI] Error processing queue for group ${groupId}:`,
      error.message,
    );
    queue.isProcessing = false;
  }
}
async function updateGroupSummary(groupId) {
  if (mongoose.connection.readyState !== 1) return;

  try {
    // 1. Get last 50 messages for context
    const messages = await Message.find({ group: groupId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "name");

    if (messages.length < 3) return; // Not enough to summarize

    const formattedMessages = messages.reverse().map((m) => ({
      user: m.sender?.name || "Member",
      message: m.content,
      timestamp: m.createdAt,
    }));

    // 2. Call AI Summarize API
    const response = await axios.post(`${AI_SERVICE_URL}/ai/summarize`, {
      messages: formattedMessages,
    });

    const summaryData = response.data;

    if (summaryData && summaryData.summary) {
      // 3. Upsert Summary in DB
      const updatedSummary = await Summary.findOneAndUpdate(
        { groupId },
        {
          content: summaryData.summary,
          keyPoints: summaryData.key_points || [],
          updatedAt: new Date(),
        },
        { upsert: true, new: true },
      );

      console.log(`[AI] [Summary] Updated for group ${groupId}`);

      // 4. Emit update to group
      io.to(`group:${groupId}`).emit("summary-updated", {
        groupId,
        summary: updatedSummary.content,
        keyPoints: updatedSummary.keyPoints,
        updatedAt: updatedSummary.updatedAt,
      });
    }
  } catch (error) {
    console.error(
      `[AI] Error updating summary for group ${groupId}:`,
      error.message,
    );
  }
}

async function checkGroupContradictions(groupId) {
  if (mongoose.connection.readyState !== 1) return;

  try {
    const messages = await Message.find({ group: groupId })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("sender", "name");

    if (messages.length < 5) return;

    const formattedMessages = messages.reverse().map((m) => ({
      user: m.sender?.name || "Member",
      message: m.content,
      timestamp: m.createdAt,
    }));

    const contexts = await Context.find({ groupId })
      .sort({ classifiedAt: -1 })
      .limit(20);

    const contextData = {
      prior_decisions: contexts
        .filter((c) => c.category.includes("DECISION"))
        .map((c) => c.content),
      prior_actions: contexts
        .filter((c) => c.category.includes("ACTION"))
        .map((c) => c.content),
      prior_constraints: contexts
        .filter((c) => c.category.includes("CONSTRAINT"))
        .map((c) => c.content),
      prior_assumptions: contexts
        .filter((c) => c.category.includes("ASSUMPTION"))
        .map((c) => c.content),
    };

    const response = await axios.post(`${AI_SERVICE_URL}/ai/contradict`, {
      messages: formattedMessages,
      context: contextData,
    });

    const contradictionData = response.data;

    if (
      contradictionData &&
      contradictionData.contradictions &&
      contradictionData.contradictions.length > 0
    ) {
      const criticalContradictions = contradictionData.contradictions.filter(
        (c) => c.severity === "critical" || c.severity === "high",
      );

      if (criticalContradictions.length > 0) {
        const warningMessage = `⚠️ Contradiction Detected: ${criticalContradictions[0].explanation}`;

        const messageData = {
          group: groupId,
          sender: new mongoose.Types.ObjectId("000000000000000000000000"),
          type: "text",
          content: warningMessage,
        };

        const message = await Message.create(messageData);

        io.to(`group:${groupId}`).emit("new-message", {
          _id: message._id.toString(),
          groupId,
          userId: "ai-system",
          userName: "signalDesk",
          userAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=signaldesk",
          content: message.content,
          type: "text",
          createdAt: message.createdAt,
        });

        console.log(
          `[AI] [Contradiction] Warning sent to group ${groupId}: ${criticalContradictions.length} contradictions found`,
        );
      }
    }
  } catch (error) {
    console.error(
      `[AI] Error checking contradictions for group ${groupId}:`,
      error.message,
    );
  }
}

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

const ContextSchema = new mongoose.Schema({
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: String,
  category: [String],
  confidence: {
    score: Number,
    reason: String,
  },
  classifiedAt: { type: Date, default: Date.now },
});

const Context =
  mongoose.models.Context || mongoose.model("Context", ContextSchema);

const SummarySchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
    unique: true,
  },
  content: {
    type: String,
    required: true,
  },
  keyPoints: [String],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Summary =
  mongoose.models.Summary || mongoose.model("Summary", SummarySchema);

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
  socket.join(socket.userId); // Join user-specific room for private notifications

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

      // Broadcast user joined event (exclude sender)
      socket.to(`group:${groupId}`).emit("new-message", {
        _id: `system-${Date.now()}`, // Temporary ID
        groupId,
        userId: socket.userId,
        userName: socket.user.name,
        userAvatar: socket.user.avatar,
        type: "system",
        content: `${socket.user.name} joined the chat. Say meow to him!`,
        createdAt: new Date().toISOString(),
      });
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
        !project.members.some((id) => id && id.toString() === socket.userId)
      ) {
        socket.emit("error", { message: "Not authorized" });
        return;
      }

      if (
        group.isPrivate &&
        !group.members.some((id) => id && id.toString() === socket.userId)
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

      // AI Queuing Logic
      if (type === "text" || !type) {
        let queue = groupQueues.get(groupId) || {
          messages: [],
          charCount: 0,
          isProcessing: false,
        };
        queue.messages.push({
          id: messageResponse._id,
          userId: messageResponse.userId,
          user: messageResponse.userName,
          message: messageResponse.content,
          timestamp: messageResponse.createdAt,
        });
        queue.charCount += messageResponse.content.length;
        groupQueues.set(groupId, queue);
        console.log(
          `[AI Queue] Group ${groupId}: Added msg. Total: ${queue.messages.length} msgs, ${queue.charCount} chars`,
        );

        // Immediate bypass for 5000+ chars
        if (queue.charCount >= 5000) {
          console.log(
            `[AI Bypass] High volume detected in group ${groupId} (${queue.charCount} chars). Triggering immediately.`,
          );
          processAIQueue(groupId);
        } else if (queue.messages.length >= 5 || queue.charCount >= 1000) {
          // Normal triggers - check every 15 seconds if not already processing
          if (!queue.isProcessing && !queue.timeoutId) {
            console.log(
              `[AI Timer] Threshold reached for group ${groupId}. Setting 5s timer.`,
            );
            queue.timeoutId = setTimeout(() => {
              processAIQueue(groupId);
              updateGroupSummary(groupId);
              checkGroupContradictions(groupId);
              queue.timeoutId = null;
            }, 5000);
          }
        }
      }

      console.log(`Message sent to group ${groupId} by user ${socket.userId}`);

      // Broadcast Notification
      const notificationPayload = {
        projectId: project._id,
        projectName: project.name,
        groupId,
        groupName: group.type === "dm" ? "Direct Message" : group.name,
        senderId: socket.userId,
        senderName: socket.user.name,
        content: content || (fileUrl ? "Sent a file" : "Sent a message"),
        type: group.type,
      };

      if (group.type === "dm" || group.isPrivate) {
        // Send to specific members (DMs or Private Channels)
        // We need accurate member list. group.members contains ObjectIds.
        group.members.forEach((memberId) => {
          if (memberId.toString() !== socket.userId) {
            io.to(memberId.toString()).emit(
              "notification",
              notificationPayload,
            );
          }
        });
      } else {
        // Public Channel - Broadcast to project room
        // Ensure sender is excluded simply by using socket.to?
        // socket.to excludes sender.
        socket
          .to(`project:${project._id}`)
          .emit("notification", notificationPayload);
      }
    } catch (error) {
      console.error("Send message error:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("send-system-message", async (data) => {
    try {
      const { groupId, content, userName, userAvatar } = data;

      const messageData = {
        group: groupId,
        sender: new mongoose.Types.ObjectId("000000000000000000000000"), // System ID
        type: "text",
        content: content || "",
      };

      const message = await Message.create(messageData);

      const messageResponse = {
        _id: message._id.toString(),
        groupId,
        userId: "ai-system",
        userName: userName || "signalDesk",
        userAvatar:
          userAvatar ||
          "https://api.dicebear.com/7.x/bottts/svg?seed=signaldesk",
        content: message.content,
        type: "text",
        createdAt: message.createdAt,
      };

      io.to(`group:${groupId}`).emit("new-message", messageResponse);
    } catch (error) {
      console.error("System message error:", error);
    }
  });

  socket.on("ai-thinking", ({ groupId, isThinking }) => {
    socket.to(`group:${groupId}`).emit("ai-status", {
      groupId,
      isThinking,
    });
  });

  socket.on("typing", ({ groupId, isTyping }) => {
    socket.to(`group:${groupId}`).emit("user-typing", {
      groupId,
      userId: socket.userId,
      isTyping,
    });
  });

  socket.on("debug:save-dummy-context", async (data) => {
    console.log(`[DEBUG] Saving dummy context for user ${socket.userId}`);
    try {
      if (mongoose.connection.readyState !== 1) {
        socket.emit("error", { message: "Database not connected" });
        return;
      }
      const dummy = await Context.create({
        messageId: new mongoose.Types.ObjectId(),
        groupId: data.groupId || new mongoose.Types.ObjectId(),
        userId: socket.userId,
        content:
          data.content || "This is a dummy AI-identified signal for testing.",
        category: [data.category || "SUGGESTION"],
        confidence: {
          score: 0.95,
          reason: "Dummy generated for debugging purposes.",
        },
        classifiedAt: new Date(),
      });
      console.log(`[DEBUG] Dummy context saved: ${dummy._id}`);
      socket.emit("signals-updated", {
        groupId: data.groupId,
        count: 1,
        message: "Dummy signal saved successfully",
      });
    } catch (err) {
      console.error("Dummy save error:", err);
    }
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
