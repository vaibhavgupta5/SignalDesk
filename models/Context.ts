import mongoose, { Schema, models } from "mongoose";

const ContextSchema = new Schema({
  messageId: {
    type: Schema.Types.ObjectId,
    ref: "Message",
    required: true,
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  content: {
    type: String,
    required: true,
  },
  category: [
    {
      type: String,
    },
  ],
  confidence: {
    score: Number,
    reason: String,
  },
  classifiedAt: {
    type: Date,
    default: Date.now,
  },
});

ContextSchema.index({ groupId: 1 });
ContextSchema.index({ messageId: 1 });

export const Context =
  models.Context || mongoose.model("Context", ContextSchema);
