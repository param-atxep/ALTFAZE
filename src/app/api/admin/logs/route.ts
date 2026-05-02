import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

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
    const limit = parseInt(searchParams.get("limit") || "50");
    const action = searchParams.get("action");

    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) {
      where.action = action;
    }

    const [logs, total] = await Promise.all([
      db.adminLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          admin: { select: { id: true, name: true, email: true } },
          targetId: true,
          targetType: true,
          description: true,
          metadata: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.adminLog.count({ where })
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Logs fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
