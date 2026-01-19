import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { User } from "@/models/User";
import { authenticateRequest } from "@/lib/middleware";

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { message: "Project ID is required" },
        { status: 400 },
      );
    }

    const project = await Project.findOne({ projectId });
    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    if (project.members.includes(user._id)) {
      return NextResponse.json(
        { message: "Already a member of this project" },
        { status: 400 },
      );
    }

    await Project.findByIdAndUpdate(project._id, {
      $addToSet: { members: user._id },
    });

    await User.findByIdAndUpdate(user._id, {
      $addToSet: { projects: project._id },
    });

    // Add to General group explicitly
    const { Group } = require("@/models/Group"); // Ensure import or use dynamic require if import issues
    await Group.findOneAndUpdate(
      { project: project._id, isDefault: true },
      { $addToSet: { members: user._id } },
    );

    const updatedProject = await Project.findById(project._id).populate(
      "owner",
      "name email avatar",
    );

    return NextResponse.json({
      project: {
        _id: updatedProject._id.toString(),
        name: updatedProject.name,
        projectId: updatedProject.projectId,
        description: updatedProject.description,
        owner: updatedProject.owner,
        members: updatedProject.members,
        accentColor: updatedProject.accentColor,
        createdAt: updatedProject.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Join project error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
