import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(status)) {
      where.status = status;
    }
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          budget: true,
          status: true,
          category: true,
          creator: { select: { id: true, name: true, email: true } },
          createdAt: true
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.project.count({ where })
    ]);

    return NextResponse.json({
      projects,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Projects list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { projectId, action } = body;

    if (!projectId || !["remove", "cancel"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    let result;
    if (action === "remove") {
      result = await db.project.delete({ where: { id: projectId } });
    } else if (action === "cancel") {
      result = await db.project.update({
        where: { id: projectId },
        data: { status: "CANCELLED" }
      });
    }

    // Log admin action
    await db.adminLog.create({
      data: {
        action: "PROJECT_REMOVED",
        adminId: session.user.id,
        targetId: projectId,
        targetType: "Project",
        description: `Admin ${action}ed project: ${project.title}`
      }
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Project action error:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
