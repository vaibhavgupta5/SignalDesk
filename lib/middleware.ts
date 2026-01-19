import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "./jwt";
import { User } from "@/models/User";
import connectDB from "./mongodb";

export async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = extractToken(authHeader);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  await connectDB();
  const user = await User.findById(payload.userId).select("-passwordHash");

  return user;
}
