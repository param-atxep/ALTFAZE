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

    // Get dashboard analytics
    const [totalUsers, totalFreelancers, totalClients, totalProjects, totalOrders, totalRevenue] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "FREELANCER" } }),
      db.user.count({ where: { role: "CLIENT" } }),
      db.project.count(),
      db.order.count(),
      db.order.aggregate({
        _sum: { amount: true },
        where: { paymentStatus: "SUCCEEDED" }
      })
    ]);

    // Get recent activity
    const [recentUsers, recentOrders, recentPayments] = await Promise.all([
      db.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
      }),
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { 
          id: true, 
          amount: true, 
          status: true, 
          paymentStatus: true,
          createdAt: true,
          client: { select: { name: true, email: true } }
        }
      }),
      db.transaction.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          type: true,
          status: true,
          createdAt: true,
          user: { select: { name: true, email: true } }
        }
      })
    ]);

    // Get monthly revenue data for last 12 months
    const monthlyRevenue = await db.order.groupBy({
      by: ["createdAt"],
      where: { paymentStatus: "SUCCEEDED" },
      _sum: { amount: true }
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalFreelancers,
        totalClients,
        totalProjects,
        totalOrders,
        totalRevenue: totalRevenue._sum.amount || 0
      },
      recentActivity: {
        users: recentUsers,
        orders: recentOrders,
        transactions: recentPayments
      },
      monthlyRevenue
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
