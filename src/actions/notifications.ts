"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function getUserNotifications(unreadOnly = false) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const notifications = await db.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return notifications;
  } catch (error) {
    logger.error("Get notifications error", { error: String(error) });
    return { error: "Failed to fetch notifications" };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    logger.error("Mark notification read error", { error: String(error) });
    return { error: "Failed to mark notification" };
  }
}

export async function markAllNotificationsAsRead() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    await db.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    logger.error("Mark all notifications read error", { error: String(error) });
    return { error: "Failed to mark notifications" };
  }
}

export async function deleteNotification(notificationId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    await db.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  } catch (error) {
    logger.error("Delete notification error", { error: String(error) });
    return { error: "Failed to delete notification" };
  }
}

export async function getUnreadCount() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const count = await db.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });

    return { unreadCount: count };
  } catch (error) {
    logger.error("Get unread count error", { error: String(error) });
    return { error: "Failed to fetch unread count" };
  }
}

export async function sendNotification(
  userId: string,
  type: string,
  message: string,
  actionUrl?: string
) {
  try {
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        message,
        actionUrl,
      },
    });

    logger.info("Notification sent", { notificationId: notification.id, userId, type });

    return { success: true, notificationId: notification.id };
  } catch (error) {
    logger.error("Send notification error", { error: String(error) });
    return { error: "Failed to send notification" };
  }
}
