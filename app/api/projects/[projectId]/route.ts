import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { authenticatedUser } from "@/lib/auth"; // Assuming auth helper name, wait, previous file used authenticateRequest from lib/middleware
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

    const project = await Project.findOne({
      _id: params.projectId,
      members: user._id,
    })
      .populate("owner", "name email avatar")
      .populate("members", "name email avatar");

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      project: {
        _id: project._id.toString(),
        name: project.name,
        projectId: project.projectId,
        description: project.description,
        owner: project.owner,
        members: project.members,
        accentColor: project.accentColor,
        createdAt: project.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, description, accentColor } = await request.json();

    await connectDB();

    const project = await Project.findOneAndUpdate(
      {
        _id: params.projectId,
        members: user._id, // Ensure user is member
      },
      {
        name,
        description,
        accentColor,
      },
      { new: true },
    )
      .populate("owner", "name email avatar")
      .populate("members", "name email avatar");

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      project: {
        _id: project._id.toString(),
        name: project.name,
        projectId: project.projectId,
        description: project.description,
        owner: project.owner,
        members: project.members,
        accentColor: project.accentColor,
        createdAt: project.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Update project error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Only owner can delete? For now assume valid member can (or check owner)
    // Checking ownership usually safer
    const project = await Project.findOne({ _id: params.projectId });

    if (!project)
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );

    if (project.owner.toString() !== user._id.toString()) {
      return NextResponse.json(
        { message: "Only owner can delete project" },
        { status: 403 },
      );
    }

    await Project.deleteOne({ _id: params.projectId });

    return NextResponse.json({ message: "Project deleted" });
  } catch (error: any) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
