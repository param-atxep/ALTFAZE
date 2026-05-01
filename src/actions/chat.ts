"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function createConversation(
  participantIds: string[],
  projectId?: string,
  orderId?: string
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const allParticipants = Array.from(
      new Set([...participantIds, session.user.id])
    );

    // Check if conversation already exists
    const existingConversation = await db.conversation.findFirst({
      where: {
        participantIds: {
          equals: allParticipants.sort(),
        },
        projectId: projectId || undefined,
      },
    });

    if (existingConversation) {
      return existingConversation;
    }

    const conversation = await db.conversation.create({
      data: {
        participantIds: allParticipants,
        projectId: projectId || undefined,
        orderId: orderId || undefined,
      },
    });

    return conversation;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
}

export async function getUserPresence(userId: string) {
  try {
    const presence = await db.userPresence.findUnique({
      where: { userId },
    });

    return presence || { userId, isOnline: false };
  } catch (error) {
    console.error("Error fetching user presence:", error);
    return { userId, isOnline: false };
  }
}

export async function sendNotification(
  userId: string,
  type: string,
  message: string,
  actionUrl?: string,
  conversationId?: string
) {
  try {
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        message,
        actionUrl,
        conversationId,
      },
    });

    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
}
