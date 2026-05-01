"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logger } from "@/lib/logger";

const WithdrawalRequestSchema = z.object({
  amount: z.number().min(100, "Minimum withdrawal is $100"),
  bankAccountLastFour: z.string().length(4, "Bank account last 4 digits required"),
});

export async function getWalletBalance() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    let wallet = await db.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      wallet = await db.wallet.create({
        data: {
          userId: session.user.id,
          balance: 0,
        },
      });
    }

    return { balance: wallet.balance, walletId: wallet.id };
  } catch (error) {
    logger.error("Get wallet balance error", { error: String(error) });
    return { error: "Failed to fetch wallet balance" };
  }
}

export async function getWalletTransactions(limit = 20, offset = 0) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const transactions = await db.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await db.transaction.count({
      where: { userId: session.user.id },
    });

    return { transactions, total, limit, offset };
  } catch (error) {
    logger.error("Get wallet transactions error", { error: String(error) });
    return { error: "Failed to fetch transactions" };
  }
}

export async function requestWithdrawal(data: z.infer<typeof WithdrawalRequestSchema>) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = WithdrawalRequestSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0]?.message || "Invalid withdrawal request" };
  }

  try {
    const wallet = await db.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      return { error: "Wallet not found" };
    }

    if (wallet.balance < validated.data.amount) {
      return { error: "Insufficient wallet balance" };
    }

    // Check for existing pending withdrawal
    const existingPending = await db.withdrawalRequest.findFirst({
      where: {
        userId: session.user.id,
        status: "PENDING",
      },
    });

    if (existingPending) {
      return { error: "You have a pending withdrawal request" };
    }

    const withdrawal = await db.withdrawalRequest.create({
      data: {
        userId: session.user.id,
        amount: validated.data.amount,
        bankAccountLastFour: validated.data.bankAccountLastFour,
        status: "PENDING",
      },
    });

    // Deduct from wallet (held for withdrawal)
    await db.wallet.update({
      where: { userId: session.user.id },
      data: { balance: { decrement: validated.data.amount } },
    });

    // Create transaction record
    await db.transaction.create({
      data: {
        userId: session.user.id,
        type: "DEBIT",
        amount: validated.data.amount,
        description: `Withdrawal request: ${withdrawal.id}`,
        referenceId: withdrawal.id,
        status: "PENDING",
      },
    });

    // Admin notification
    await db.adminNotification.create({
      data: {
        type: "WITHDRAWAL_REQUEST",
        title: "New Withdrawal Request",
        message: `User requested withdrawal of $${validated.data.amount}`,
        priority: "normal",
      },
    });

    logger.info("Withdrawal requested", {
      withdrawalId: withdrawal.id,
      userId: session.user.id,
      amount: validated.data.amount,
    });

    return { success: true, withdrawalId: withdrawal.id };
  } catch (error) {
    logger.error("Withdrawal request error", { error: String(error) });
    return { error: "Failed to create withdrawal request" };
  }
}

export async function getWithdrawalRequests() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const withdrawals = await db.withdrawalRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { requestedAt: "desc" },
    });

    return withdrawals;
  } catch (error) {
    logger.error("Get withdrawals error", { error: String(error) });
    return { error: "Failed to fetch withdrawals" };
  }
}

export async function transferWallet(recipientId: string, amount: number) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (amount <= 0) {
    return { error: "Amount must be greater than 0" };
  }

  try {
    const senderWallet = await db.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!senderWallet || senderWallet.balance < amount) {
      return { error: "Insufficient balance" };
    }

    let recipientWallet = await db.wallet.findUnique({
      where: { userId: recipientId },
    });

    if (!recipientWallet) {
      recipientWallet = await db.wallet.create({
        data: {
          userId: recipientId,
          balance: 0,
        },
      });
    }

    // Transfer
    await db.wallet.update({
      where: { userId: session.user.id },
      data: { balance: { decrement: amount } },
    });

    await db.wallet.update({
      where: { userId: recipientId },
      data: { balance: { increment: amount } },
    });

    // Record transactions
    await db.transaction.create({
      data: {
        userId: session.user.id,
        type: "DEBIT",
        amount,
        description: `Transfer to ${recipientId}`,
        referenceId: recipientId,
        status: "SUCCEEDED",
      },
    });

    await db.transaction.create({
      data: {
        userId: recipientId,
        type: "CREDIT",
        amount,
        description: `Transfer from ${session.user.id}`,
        referenceId: session.user.id,
        status: "SUCCEEDED",
      },
    });

    logger.info("Wallet transfer completed", {
      from: session.user.id,
      to: recipientId,
      amount,
    });

    return { success: true };
  } catch (error) {
    logger.error("Wallet transfer error", { error: String(error) });
    return { error: "Failed to transfer wallet" };
  }
}
