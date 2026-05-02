import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const SendMessageSchema = z.object({
  conversationId: z.string(),
  text: z.string().min(1, 'Message cannot be empty'),
  fileUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = SendMessageSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Invalid message data' },
        { status: 400 }
      );
    }

    const conversation = await db.conversation.findUnique({
      where: { id: validated.data.conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user is participant
    if (!conversation.participantIds.includes(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create message
    const message = await db.message.create({
      data: {
        conversationId: validated.data.conversationId,
        senderId: session.user.id,
        text: validated.data.text,
        fileUrl: validated.data.fileUrl,
      },
    });

    // Update conversation lastMessage
    await db.conversation.update({
      where: { id: validated.data.conversationId },
      data: {
        lastMessageAt: new Date(),
      },
    });

    // Create notification for other participants
    const otherParticipants = conversation.participantIds.filter(
      (id) => id !== session.user.id
    );

    for (const participantId of otherParticipants) {
      await db.notification.create({
        data: {
          userId: participantId,
          type: 'MESSAGE',
          message: validated.data.text.substring(0, 100),
          actionUrl: `/chat/${validated.data.conversationId}`,
        },
      });
    }

    logger.info('Message sent', {
      messageId: message.id,
      conversationId: conversation.id,
      senderId: session.user.id,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    logger.error('Send message error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (!conversation.participantIds.includes(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const messages = await db.message.findMany({
      where: { conversationId },
      include: {
        sender: {
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

    const total = await db.message.count({
      where: { conversationId },
    });

    // Mark as read
    await db.message.updateMany({
      where: {
        conversationId,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json(
      {
        messages: messages.reverse(),
        total,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Get messages error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
