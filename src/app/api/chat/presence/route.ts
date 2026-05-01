import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update presence
    const now = new Date();
    let presence = await db.userPresence.findUnique({
      where: { userId: session.user.id },
    });

    if (presence) {
      await db.userPresence.update({
        where: { userId: session.user.id },
        data: {
          isOnline: true,
          lastSeenAt: now,
        },
      });
    } else {
      await db.userPresence.create({
        data: {
          userId: session.user.id,
          isOnline: true,
          lastSeenAt: now,
        },
      });
    }

    logger.info('User presence updated', { userId: session.user.id });

    return NextResponse.json(
      {
        success: true,
        timestamp: now,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Update presence error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to update presence' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const presence = await db.userPresence.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json(
      {
        userId: session.user.id,
        isOnline: presence?.isOnline || false,
        lastSeenAt: presence?.lastSeenAt,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Get presence error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to fetch presence' }, { status: 500 });
  }
}
