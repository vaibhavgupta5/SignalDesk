import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: "",
  },
  projects: [
    {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Email index is auto-handled by unique: true

export const User = models.User || mongoose.model("User", UserSchema);
