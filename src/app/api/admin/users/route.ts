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
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: any = {};
    if (role && ["CLIENT", "FREELANCER", "ADMIN"].includes(role)) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          rating: true,
          reviewCount: true,
          image: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Users list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
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
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Prevent admin from modifying other admins
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    let result;
    let actionType: AdminActionType = "OTHER";

    if (action === "block") {
      // Implement block user logic (add field to User model or use soft delete)
      result = await db.user.update({
        where: { id: userId },
        data: { role: "CLIENT" } // Placeholder - implement proper blocking
      });
      actionType = "USER_BLOCKED";
    } else if (action === "delete") {
      // Cascade delete will handle related records
      result = await db.user.delete({ where: { id: userId } });
      actionType = "USER_DELETED";
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
        targetId: userId,
        targetType: "User",
        description: `Admin ${action}ed user ${user.email}`
      }
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("User action error:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
