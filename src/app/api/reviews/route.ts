import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const CreateReviewSchema = z.object({
  targetId: z.string(),
  orderId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, 'Review must be at least 10 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = CreateReviewSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Invalid review data' },
        { status: 400 }
      );
    }

    const order = await db.order.findUnique({
      where: { id: validated.data.orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.clientId !== session.user.id && order.freelancerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if already reviewed
    const existing = await db.review.findFirst({
      where: {
        orderId: validated.data.orderId,
        authorId: session.user.id,
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'You already reviewed this order' }, { status: 400 });
    }

    const review = await db.review.create({
      data: {
        targetId: validated.data.targetId,
        authorId: session.user.id,
        orderId: validated.data.orderId,
        rating: validated.data.rating,
        comment: validated.data.comment,
      },
    });

    // Update target user's rating
    const reviews = await db.review.findMany({
      where: { targetId: validated.data.targetId },
    });

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await db.user.update({
      where: { id: validated.data.targetId },
      data: {
        rating: avgRating,
        reviewCount: reviews.length,
      },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: validated.data.targetId,
        type: 'NEW_REVIEW',
        message: `${session.user.name} left you a ${validated.data.rating}-star review`,
        actionUrl: `/profile/${validated.data.targetId}`,
      },
    });

    logger.info('Review created', {
      reviewId: review.id,
      targetId: validated.data.targetId,
      rating: validated.data.rating,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    logger.error('Create review error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('targetId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!targetId) {
      return NextResponse.json(
        { error: 'Target ID required' },
        { status: 400 }
      );
    }

    const reviews = await db.review.findMany({
      where: { targetId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.review.count({ where: { targetId } });

    return NextResponse.json(
      {
        reviews,
        total,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Get reviews error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
