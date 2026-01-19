import mongoose, { Schema, models } from "mongoose";

const MessageSchema = new Schema({
  group: {
    type: Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["text", "image", "file"],
    default: "text",
  },
  content: {
    type: String,
    required: true,
  },
  fileMeta: {
    name: String,
    size: Number,
    mime: String,
    url: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

MessageSchema.index({ group: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });

export const Message =
  models.Message || mongoose.model("Message", MessageSchema);
