import mongoose, { Schema, models } from "mongoose";
import { nanoid } from "nanoid";

const ProjectSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  projectId: {
    type: String,
    unique: true,
    default: () => nanoid(10),
  },
  description: {
    type: String,
    default: "",
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  accentColor: {
    type: String,
    default: "#7C3AED",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ProjectSchema.index({ owner: 1 });

export const Project =
  models.Project || mongoose.model("Project", ProjectSchema);
