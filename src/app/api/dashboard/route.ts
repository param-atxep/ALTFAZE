import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user.role === 'FREELANCER' 
      ? 'freelancer' 
      : session.user.role === 'CLIENT'
      ? 'client'
      : 'admin';

    if (user === 'client') {
      // Client dashboard
      const [postedProjects, activeOrders, wallet, purchaseHistory] = await Promise.all([
        db.project.findMany({
          where: { creatorId: session.user.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        db.order.findMany({
          where: { clientId: session.user.id },
          include: { project: true, freelancer: { select: { name: true, image: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        db.wallet.findUnique({ where: { userId: session.user.id } }),
        db.templatePurchase.findMany({
          where: { buyerId: session.user.id },
          include: { template: { select: { title: true, image: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

      return NextResponse.json(
        {
          role: 'client',
          stats: {
            postedProjects: postedProjects.length,
            activeOrders: activeOrders.filter((o) => o.status !== 'COMPLETED').length,
            walletBalance: wallet?.balance || 0,
            totalSpent: purchaseHistory.reduce((sum, p) => sum + p.amount, 0),
          },
          recentProjects: postedProjects,
          activeOrders: activeOrders.filter((o) => ['ACCEPTED', 'IN_PROGRESS'].includes(o.status)),
          purchases: purchaseHistory,
        },
        { status: 200 }
      );
    }

    if (user === 'freelancer') {
      // Freelancer dashboard
      const [proposalsSent, activeOrders, wallet, earnings] = await Promise.all([
        db.proposal.findMany({
          where: { freelancerId: session.user.id },
          include: { project: { select: { title: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        db.order.findMany({
          where: { freelancerId: session.user.id },
          include: { project: true, client: { select: { name: true, image: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        db.wallet.findUnique({ where: { userId: session.user.id } }),
        db.transaction.aggregate({
          where: { userId: session.user.id, type: 'CREDIT' },
          _sum: { amount: true },
        }),
      ]);

      const completedOrders = activeOrders.filter((o) => o.status === 'COMPLETED').length;

      return NextResponse.json(
        {
          role: 'freelancer',
          stats: {
            proposalsSent: proposalsSent.length,
            activeOrders: activeOrders.filter((o) => o.status === 'IN_PROGRESS').length,
            completedOrders,
            walletBalance: wallet?.balance || 0,
            totalEarnings: earnings._sum.amount || 0,
          },
          recentProposals: proposalsSent,
          activeOrders: activeOrders.filter((o) => o.status === 'IN_PROGRESS'),
          earnings: {
            pending: activeOrders
              .filter((o) => o.status === 'IN_PROGRESS')
              .reduce((sum, o) => sum + o.amount, 0),
            available: wallet?.balance || 0,
            total: earnings._sum.amount || 0,
          },
        },
        { status: 200 }
      );
    }

    // Admin dashboard
    const [userCount, templateCount, orderCount, totalRevenue, pendingWithdrawals] =
      await Promise.all([
        db.user.count(),
        db.template.count(),
        db.order.count(),
        db.order.aggregate({
          _sum: { amount: true },
          where: { paymentStatus: 'SUCCEEDED' },
        }),
        db.withdrawalRequest.count({ where: { status: 'PENDING' } }),
      ]);

    return NextResponse.json(
      {
        role: 'admin',
        stats: {
          totalUsers: userCount,
          totalTemplates: templateCount,
          totalOrders: orderCount,
          totalRevenue: totalRevenue._sum.amount || 0,
          pendingWithdrawals,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Get dashboard error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}
