import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Message } from "@/models/Message";
import { Group } from "@/models/Group";
import { Project } from "@/models/Project";
import { authenticateRequest } from "@/lib/middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } },
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const group = await Group.findById(params.groupId);
    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    const project = await Project.findById(group.project);
    if (!project || !project.members.includes(user._id)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const messages = await Message.find({ group: params.groupId })
      .populate("sender", "name email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      messages: messages.reverse().map((m: any) => {
        const isSystem =
          m.sender?.toString() === "000000000000000000000000" || !m.sender;
        return {
          _id: m._id.toString(),
          groupId: m.group.toString(),
          userId: isSystem
            ? "ai-system"
            : m.sender?._id?.toString() || "deleted-user",
          userName: isSystem
            ? "signalDesk"
            : (m.sender as any)?.name || "Deleted User",
          userAvatar: isSystem
            ? "https://api.dicebear.com/7.x/bottts/svg?seed=signaldesk"
            : (m.sender as any)?.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${m.sender?._id || "unknown"}`,
          content: m.content,
          type: m.type,
          fileUrl: m.fileMeta?.url,
          fileName: m.fileMeta?.name,
          fileSize: m.fileMeta?.size,
          createdAt: m.createdAt,
        };
      }),
    });
  } catch (error: any) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
