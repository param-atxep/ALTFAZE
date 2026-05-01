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

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        role: true,
        rating: true,
        reviewCount: true,
        skills: true,
        isBanned: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get stats based on role
    let stats = {};

    if (user.role === 'FREELANCER') {
      const [completedOrders, totalEarnings, activeOrders] = await Promise.all([
        db.order.count({
          where: { freelancerId: session.user.id, status: 'COMPLETED' },
        }),
        db.transaction.aggregate({
          where: { userId: session.user.id, type: 'CREDIT' },
          _sum: { amount: true },
        }),
        db.order.count({
          where: { freelancerId: session.user.id, status: 'IN_PROGRESS' },
        }),
      ]);

      stats = {
        completedOrders,
        totalEarnings: totalEarnings._sum.amount || 0,
        activeOrders,
      };
    } else if (user.role === 'CLIENT') {
      const [postedProjects, activeOrders, totalSpent] = await Promise.all([
        db.project.count({
          where: { creatorId: session.user.id },
        }),
        db.order.count({
          where: { clientId: session.user.id, status: 'IN_PROGRESS' },
        }),
        db.templatePurchase.aggregate({
          where: { buyerId: session.user.id },
          _sum: { amount: true },
        }),
      ]);

      stats = {
        postedProjects,
        activeOrders,
        totalSpent: totalSpent._sum.amount || 0,
      };
    }

    logger.info('User fetch profile', { userId: session.user.id });

    return NextResponse.json(
      {
        user,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Get profile error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
