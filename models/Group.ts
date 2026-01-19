import mongoose, { Schema, models } from "mongoose";

const GroupSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    enum: ["channel", "dm"],
    default: "channel",
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

GroupSchema.index({ project: 1 });
GroupSchema.index({ project: 1, name: 1 });

GroupSchema.index({ project: 1, name: 1 });

if (mongoose.models.Group) {
  delete mongoose.models.Group;
}

export const Group = mongoose.model("Group", GroupSchema);
