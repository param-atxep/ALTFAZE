"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logger } from "@/lib/logger";

const ApproveTemplateSchema = z.object({
  templateId: z.string(),
});

const BanUserSchema = z.object({
  userId: z.string(),
  reason: z.string().min(10),
});

const ApproveWithdrawalSchema = z.object({
  withdrawalId: z.string(),
  razorpayPayoutId: z.string().optional(),
});

export async function getAdminStats() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const [userCount, templateCount, orderCount, totalRevenue, pendingWithdrawals] =
      await Promise.all([
        db.user.count(),
        db.template.count(),
        db.order.count(),
        db.order.aggregate({
          _sum: {
            amount: true,
          },
          where: { paymentStatus: "SUCCEEDED" },
        }),
        db.withdrawalRequest.count({
          where: { status: "PENDING" },
        }),
      ]);

    return {
      userCount,
      templateCount,
      orderCount,
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingWithdrawals,
    };
  } catch (error) {
    logger.error("Get admin stats error", { error: String(error) });
    return { error: "Failed to fetch stats" };
  }
}

export async function getPendingTemplates() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const templates = await db.template.findMany({
      where: { status: "PENDING" },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return templates;
  } catch (error) {
    logger.error("Get pending templates error", { error: String(error) });
    return { error: "Failed to fetch templates" };
  }
}

export async function approveTemplate(data: z.infer<typeof ApproveTemplateSchema>) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const template = await db.template.findUnique({
      where: { id: data.templateId },
    });

    if (!template) {
      return { error: "Template not found" };
    }

    const updated = await db.template.update({
      where: { id: data.templateId },
      data: { status: "APPROVED" },
    });

    // Create admin log
    await db.adminLog.create({
      data: {
        action: "TEMPLATE_APPROVED",
        adminId: session.user.id,
        targetId: template.id,
        description: `Template "${template.title}" approved`,
      },
    });

    // Notify creator
    await db.notification.create({
      data: {
        userId: template.creatorId,
        type: "TEMPLATE_APPROVED",
        message: `Your template "${template.title}" has been approved!`,
        actionUrl: `/templates/${template.id}`,
      },
    });

    logger.info("Template approved", { templateId: template.id, adminId: session.user.id });

    return { success: true, template: updated };
  } catch (error) {
    logger.error("Approve template error", { error: String(error) });
    return { error: "Failed to approve template" };
  }
}

export async function rejectTemplate(templateId: string, reason: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  if (!reason || reason.length < 10) {
    return { error: "Rejection reason required" };
  }

  try {
    const template = await db.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return { error: "Template not found" };
    }

    const updated = await db.template.update({
      where: { id: templateId },
      data: { status: "REJECTED" },
    });

    // Create admin log
    await db.adminLog.create({
      data: {
        action: "TEMPLATE_REJECTED",
        adminId: session.user.id,
        targetId: template.id,
        description: `Template rejected: ${reason}`,
      },
    });

    // Notify creator
    await db.notification.create({
      data: {
        userId: template.creatorId,
        type: "TEMPLATE_REJECTED",
        message: `Template "${template.title}" was rejected. Reason: ${reason}`,
        actionUrl: `/seller/templates`,
      },
    });

    logger.warn("Template rejected", { templateId: template.id, adminId: session.user.id });

    return { success: true, template: updated };
  } catch (error) {
    logger.error("Reject template error", { error: String(error) });
    return { error: "Failed to reject template" };
  }
}

export async function banUser(data: z.infer<typeof BanUserSchema>) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const validated = BanUserSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Invalid ban data" };
  }

  try {
    const user = await db.user.findUnique({
      where: { id: validated.data.userId },
    });

    if (!user) {
      return { error: "User not found" };
    }

    if (user.role === "ADMIN") {
      return { error: "Cannot ban admin users" };
    }

    await db.user.update({
      where: { id: validated.data.userId },
      data: { isBanned: true },
    });

    await db.adminLog.create({
      data: {
        action: "USER_BANNED",
        adminId: session.user.id,
        targetId: user.id,
        description: `User banned: ${validated.data.reason}`,
      },
    });

    logger.warn("User banned", { userId: user.id, adminId: session.user.id });

    return { success: true };
  } catch (error) {
    logger.error("Ban user error", { error: String(error) });
    return { error: "Failed to ban user" };
  }
}

export async function getPendingWithdrawals() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const withdrawals = await db.withdrawalRequest.findMany({
      where: { status: "PENDING" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { requestedAt: "asc" },
    });

    return withdrawals;
  } catch (error) {
    logger.error("Get pending withdrawals error", { error: String(error) });
    return { error: "Failed to fetch withdrawals" };
  }
}

export async function approveWithdrawal(data: z.infer<typeof ApproveWithdrawalSchema>) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const withdrawal = await db.withdrawalRequest.findUnique({
      where: { id: data.withdrawalId },
    });

    if (!withdrawal) {
      return { error: "Withdrawal not found" };
    }

    const updated = await db.withdrawalRequest.update({
      where: { id: data.withdrawalId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: session.user.id,
        razorpayPayoutId: data.razorpayPayoutId,
      },
    });

    await db.transaction.updateMany({
      where: { referenceId: withdrawal.id },
      data: { status: "SUCCEEDED" },
    });

    await db.adminLog.create({
      data: {
        action: "WITHDRAWAL_APPROVED",
        adminId: session.user.id,
        targetId: withdrawal.userId,
        description: `Withdrawal of $${withdrawal.amount} approved`,
      },
    });

    await db.notification.create({
      data: {
        userId: withdrawal.userId,
        type: "WITHDRAWAL_APPROVED",
        message: `Your withdrawal request of $${withdrawal.amount} has been approved!`,
        actionUrl: `/wallet`,
      },
    });

    logger.info("Withdrawal approved", {
      withdrawalId: withdrawal.id,
      adminId: session.user.id,
    });

    return { success: true, withdrawal: updated };
  } catch (error) {
    logger.error("Approve withdrawal error", { error: String(error) });
    return { error: "Failed to approve withdrawal" };
  }
}

export async function rejectWithdrawal(withdrawalId: string, reason: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const withdrawal = await db.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      return { error: "Withdrawal not found" };
    }

    const updated = await db.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
      },
    });

    // Return funds to wallet
    const wallet = await db.wallet.findUnique({
      where: { userId: withdrawal.userId },
    });

    if (wallet) {
      await db.wallet.update({
        where: { userId: withdrawal.userId },
        data: { balance: { increment: withdrawal.amount } },
      });
    }

    await db.transaction.create({
      data: {
        userId: withdrawal.userId,
        type: "CREDIT",
        amount: withdrawal.amount,
        description: `Withdrawal rejection: ${reason}`,
        referenceId: withdrawalId,
        status: "SUCCEEDED",
      },
    });

    await db.notification.create({
      data: {
        userId: withdrawal.userId,
        type: "WITHDRAWAL_REJECTED",
        message: `Your withdrawal request was rejected. Reason: ${reason}`,
        actionUrl: `/wallet`,
      },
    });

    logger.warn("Withdrawal rejected", {
      withdrawalId,
      adminId: session.user.id,
    });

    return { success: true, withdrawal: updated };
  } catch (error) {
    logger.error("Reject withdrawal error", { error: String(error) });
    return { error: "Failed to reject withdrawal" };
  }
}

export async function getAdminLogs(limit = 50, offset = 0) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const logs = await db.adminLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await db.adminLog.count();

    return { logs, total, limit, offset };
  } catch (error) {
    logger.error("Get admin logs error", { error: String(error) });
    return { error: "Failed to fetch logs" };
  }
}
