import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await req.json();
  const userId = params.id;

  try {
    if (action === "block") {
      await db.user.update({
        where: { id: userId },
        data: { isBanned: true },
      });

      await db.adminLog.create({
        data: {
          action: "USER_BLOCKED",
          adminId: session.user.id,
          targetId: userId,
          targetType: "USER",
          description: `User ${userId} blocked`,
        },
      });

      return NextResponse.json({ success: true, message: "User blocked" });
    } else if (action === "unblock") {
      await db.user.update({
        where: { id: userId },
        data: { isBanned: false },
      });

      await db.adminLog.create({
        data: {
          action: "OTHER",
          adminId: session.user.id,
          targetId: userId,
          targetType: "USER",
          description: `User ${userId} unblocked`,
        },
      });

      return NextResponse.json({ success: true, message: "User unblocked" });
    } else if (action === "delete") {
      await db.user.delete({
        where: { id: userId },
      });

      await db.adminLog.create({
        data: {
          action: "USER_DELETED",
          adminId: session.user.id,
          targetId: userId,
          targetType: "USER",
          description: `User ${userId} deleted`,
        },
      });

      return NextResponse.json({ success: true, message: "User deleted" });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Admin user action error:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: params.id },
    include: {
      projects: { take: 5 },
      orders: { take: 5 },
      wallet: true,
      profile: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
