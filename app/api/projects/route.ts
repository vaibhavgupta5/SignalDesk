import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { Group } from "@/models/Group";
import { User } from "@/models/User";
import { authenticateRequest } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const projects = await Project.find({
      members: user._id,
    })
      .populate("owner", "name email avatar")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      projects: projects.map((p) => ({
        _id: p._id.toString(),
        name: p.name,
        projectId: p.projectId,
        description: p.description,
        owner: p.owner,
        members: p.members,
        accentColor: p.accentColor,
        createdAt: p.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Get projects error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { name, description, accentColor } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: "Project name is required" },
        { status: 400 },
      );
    }

    const project = await Project.create({
      name,
      description,
      accentColor: accentColor || "#7C3AED",
      owner: user._id,
      members: [user._id],
    });

    await User.findByIdAndUpdate(user._id, {
      $addToSet: { projects: project._id },
    });

    const generalGroup = await Group.create({
      name: "general",
      project: project._id,
      description: "General discussion",
      isDefault: true,
      members: [user._id],
    });

    const populatedProject = await Project.findById(project._id).populate(
      "owner",
      "name email avatar",
    );

    return NextResponse.json({
      project: {
        _id: populatedProject._id.toString(),
        name: populatedProject.name,
        projectId: populatedProject.projectId,
        description: populatedProject.description,
        owner: populatedProject.owner,
        members: populatedProject.members,
        accentColor: populatedProject.accentColor,
        createdAt: populatedProject.createdAt,
      },
      generalGroup: {
        _id: generalGroup._id.toString(),
        name: generalGroup.name,
        projectId: project._id.toString(),
        description: generalGroup.description,
        isDefault: generalGroup.isDefault,
        createdAt: generalGroup.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
