import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Group } from "@/models/Group";
import { Project } from "@/models/Project";
import { authenticateRequest } from "@/lib/middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const project = await Project.findById(params.projectId);
    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    if (!project.members.includes(user._id)) {
      return NextResponse.json(
        { message: "Not a member of this project" },
        { status: 403 },
      );
    }

    // Filter based on privacy and membership
    const groups = await Group.find({
      project: params.projectId,
      $or: [
        { isPrivate: { $ne: true } }, // Public (or undefined treated as public)
        { isPrivate: true, members: user._id }, // Private and member
      ],
    }).sort({
      createdAt: 1,
    });

    return NextResponse.json({
      groups: groups.map((g) => ({
        _id: g._id.toString(),
        name: g.name,
        projectId: g.project.toString(),
        description: g.description,
        isDefault: g.isDefault,
        isPrivate: g.isPrivate || false,
        isPrivate: g.isPrivate || false,
        type: g.type || "channel",
        members: g.members, // Return plain members, frontend can handle display login
        createdAt: g.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Get groups error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const project = await Project.findById(params.projectId);
    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    if (!project.members.includes(user._id)) {
      return NextResponse.json(
        { message: "Not a member of this project" },
        { status: 403 },
      );
    }

    const { name, description, isPrivate, members, type } =
      await request.json();

    if (!name) {
      return NextResponse.json(
        { message: "Group name is required" },
        { status: 400 },
      );
    }

    const group = await Group.create({
      name,
      description,
      project: params.projectId,
      isDefault: false,
      isPrivate: !!isPrivate,
      type: type || "channel",
      members: members || [user._id],
    });

    return NextResponse.json({
      group: {
        _id: group._id.toString(),
        name: group.name,
        projectId: group.project.toString(),
        description: group.description,
        isDefault: group.isDefault,
        isPrivate: group.isPrivate,
        type: group.type,
        members: group.members,
        createdAt: group.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Create group error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
