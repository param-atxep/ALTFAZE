import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { AdminActionType } from "@prisma/client";
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
    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      where.status = status;
    }
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const [templates, total] = await Promise.all([
      db.template.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          status: true,
          downloads: true,
          rating: true,
          creator: { select: { id: true, name: true, email: true } },
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.template.count({ where })
    ]);

    return NextResponse.json({
      templates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Templates list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
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
    const { templateId, action } = body;

    if (!templateId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const template = await db.template.findUnique({ where: { id: templateId } });
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    let result;
    let actionType: AdminActionType = "OTHER";

    if (action === "approve") {
      result = await db.template.update({
        where: { id: templateId },
        data: { status: "APPROVED" }
      });
      actionType = "TEMPLATE_APPROVED";
    } else if (action === "reject") {
      result = await db.template.update({
        where: { id: templateId },
        data: { status: "REJECTED" }
      });
      actionType = "TEMPLATE_REJECTED";
    } else if (action === "delete") {
      result = await db.template.delete({ where: { id: templateId } });
      actionType = "TEMPLATE_DELETED";
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    // Log admin action
    await db.adminLog.create({
      data: {
        action: actionType,
        adminId: session.user.id,
        targetId: templateId,
        targetType: "Template",
        description: `Admin ${action}ed template: ${template.title}`
      }
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Template action error:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
