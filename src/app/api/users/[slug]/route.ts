import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { slugify } from '@/lib/performance';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await db.user.findUnique({
      where: { slug: slugify(params.slug) },
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
        createdAt: true,
        isBanned: false,
      },
    });

    if (!user || user.isBanned) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If freelancer, include portfolio
    let portfolio = null;
    if (user.role === 'FREELANCER') {
      const [completedOrders, templates] = await Promise.all([
        db.order.count({
          where: {
            freelancerId: user.id,
            status: 'COMPLETED',
          },
        }),
        db.template.findMany({
          where: {
            creatorId: user.id,
            status: 'APPROVED',
          },
          select: {
            id: true,
            title: true,
            image: true,
            price: true,
            rating: true,
            purchaseCount: true,
          },
          take: 6,
          orderBy: { purchaseCount: 'desc' },
        }),
      ]);

      portfolio = {
        completedOrders,
        topTemplates: templates,
      };
    }

    logger.info('User profile fetched', { userId: user.id });

    return NextResponse.json(
      {
        user,
        portfolio,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Get user profile error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}
