import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Summary } from "@/models/Summary";
import { authenticateRequest } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json(
        { message: "groupId is required" },
        { status: 400 },
      );
    }

    const summary = await Summary.findOne({ groupId });

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Fetch summary error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
