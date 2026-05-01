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

    // Get analytics data
    const [
      totalRevenue,
      monthlyRevenue,
      revenueLastMonth,
      newUsersLastMonth,
      totalTemplates,
      topFreelancers,
      topTemplates
    ] = await Promise.all([
      // Total revenue
      db.order.aggregate({
        _sum: { amount: true },
        where: { paymentStatus: "SUCCEEDED" }
      }),
      // Revenue by month (last 12 months)
      db.order.groupBy({
        by: ["createdAt"],
        _sum: { amount: true },
        where: {
          paymentStatus: "SUCCEEDED",
          createdAt: {
            gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Revenue last 30 days
      db.order.aggregate({
        _sum: { amount: true },
        where: {
          paymentStatus: "SUCCEEDED",
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // New users last 30 days
      db.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Total templates
      db.template.count(),
      // Top freelancers by earned
      db.user.findMany({
        where: { role: "FREELANCER" },
        select: {
          id: true,
          name: true,
          email: true,
          rating: true,
          reviewCount: true,
          wallet: { select: { balance: true } }
        },
        orderBy: { rating: "desc" },
        take: 10
      }),
      // Top templates
      db.template.findMany({
        select: {
          id: true,
          title: true,
          creator: { select: { name: true } },
          downloads: true,
          rating: true,
          price: true
        },
        orderBy: { downloads: "desc" },
        take: 10
      })
    ]);

    // Calculate growth rate
    const totalRevenueAmount = totalRevenue._sum.amount || 0;
    const lastMonthRevenueAmount = revenueLastMonth._sum.amount || 0;
    const growthRate = totalRevenueAmount > 0 
      ? ((lastMonthRevenueAmount / totalRevenueAmount) * 100).toFixed(2)
      : "0";

    return NextResponse.json({
      revenue: {
        total: totalRevenueAmount,
        lastMonth: lastMonthRevenueAmount,
        growthRate: parseFloat(growthRate)
      },
      users: {
        newLastMonth: newUsersLastMonth
      },
      templates: {
        total: totalTemplates
      },
      charts: {
        monthlyRevenue: monthlyRevenue.map(item => ({
          month: new Date(item.createdAt).toLocaleDateString("en-US", { month: "short" }),
          revenue: item._sum.amount || 0
        }))
      },
      topFreelancers,
      topTemplates
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
