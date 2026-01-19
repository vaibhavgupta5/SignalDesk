import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/middleware";
import connectDB from "@/lib/mongodb";
import { Group } from "@/models/Group";
import { Project } from "@/models/Project";

export async function PUT(
  request: NextRequest,
  { params }: { params: { groupId: string } },
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { name, description, isPrivate, members } = await request.json();
    const group = await Group.findById(params.groupId);

    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    const project = await Project.findById(group.project);
    // Only owner can update for now (or maybe allow members to leave? Handling simple update first)
    if (project.owner.toString() !== user._id.toString()) {
      return NextResponse.json(
        {
          message: `Forbidden: Only project owner can update channels. Owner: ${project.owner}, You: ${user._id}`,
        },
        { status: 403 },
      );
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      params.groupId,
      {
        name,
        description,
        isPrivate,
        ...(members && { members }), // Verify if provided
      },
      { new: true },
    ).populate({
      path: "members",
      select: "name email avatar",
      strictPopulate: false,
    });

    return NextResponse.json({ group: updatedGroup });
  } catch (error: any) {
    // ... logic
    console.error("Update group error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } },
) {
  try {
    const user = await authenticateRequest(request);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    await connectDB();
    const group = await Group.findById(params.groupId).populate({
      path: "members",
      select: "name email avatar",
      strictPopulate: false,
    });

    if (!group)
      return NextResponse.json({ message: "Group not found" }, { status: 404 });

    // Check access: project member or group member (if private)
    // Actually simpler: if private, must be in group.members. If public, must be in project.members.
    // We can fetch project to check.

    const project = await Project.findById(group.project);

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    if (
      !project.members.some((id: any) => id.toString() === user._id.toString())
    ) {
      return NextResponse.json(
        { message: "Not a member of this project" },
        { status: 403 },
      );
    }

    if (
      group.isPrivate &&
      !group.members.some((m: any) => m._id.toString() === user._id.toString())
    ) {
      return NextResponse.json(
        { message: "Not a member of this private channel" },
        { status: 403 },
      );
    }

    return NextResponse.json({ group });
  } catch (error: any) {
    console.error("Get group error:", error);
    return NextResponse.json(
      { message: `Internal server error: ${error.message}` },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    if (group.isDefault) {
      return NextResponse.json(
        { message: "Cannot delete the default channel" },
        { status: 400 },
      );
    }

    const project = await Project.findById(group.project);
    if (project.owner.toString() !== user._id.toString()) {
      return NextResponse.json(
        { message: "Forbidden: Only project owner can delete channels" },
        { status: 403 },
      );
    }

    await Group.findByIdAndDelete(params.groupId);
    // TODO: cleanup messages?

    return NextResponse.json({ message: "Group deleted successfully" });
  } catch (error: any) {
    console.error("Delete group error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
