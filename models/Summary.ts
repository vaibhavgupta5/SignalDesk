import mongoose, { Schema, models } from "mongoose";

const SummarySchema = new Schema({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: "Group",
    required: true,
    unique: true,
  },
  content: {
    type: String,
    required: true,
  },
  keyPoints: [
    {
      type: String,
    },
  ],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Summary =
  models.Summary || mongoose.model("Summary", SummarySchema);
