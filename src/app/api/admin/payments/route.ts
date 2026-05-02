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
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && ["PENDING", "SUCCEEDED", "FAILED", "CANCELLED"].includes(status)) {
      where.status = status;
    }

    const [transactions, total] = await Promise.all([
      db.order.findMany({
        where: { ...where },
        select: {
          id: true,
          amount: true,
          status: true,
          paymentStatus: true,
          escrowStatus: true,
          stripePaymentIntentId: true,
          client: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, title: true } },
          createdAt: true
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.order.count({ where })
    ]);

    // Also get template purchases
    const templatePurchases = await db.templatePurchase.findMany({
      select: {
        id: true,
        amount: true,
        status: true,
        paymentStatus: true,
        escrowStatus: true,
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        template: { select: { id: true, title: true } },
        createdAt: true
      },
      skip,
      take: limit
    });

    return NextResponse.json({
      orders: transactions,
      templatePurchases,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Payments list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
