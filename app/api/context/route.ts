import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Context } from "@/models/Context";
import { verifyToken } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get token from header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const groupId = searchParams.get("groupId");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;

    let query: any = {};
    if (groupId) {
      query.groupId = groupId;
    }
    if (category) {
      query.category = category.toUpperCase();
    }

    // Fetch contexts for this user, populate message and group info if possible
    let contextQuery = Context.find(query)
      .populate("groupId", "name")
      .populate("userId", "name avatar")
      .sort({ classifiedAt: -1 });

    if (limit) {
      contextQuery = contextQuery.limit(limit);
    }

    const contexts = await contextQuery;

    return NextResponse.json({ contexts });
  } catch (error: any) {
    console.error("Fetch contexts error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
