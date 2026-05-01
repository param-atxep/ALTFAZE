'use server';

import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const WithdrawalRequestSchema = z.object({
  amount: z.number().min(10).max(10000),
  bankAccount: z.string().min(4).max(4),
});

export async function initiateTemplatePayment(
  templateId: string,
  sellerId: string
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return { error: 'Unauthorized' };
    }

    const buyer = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!buyer) {
      return { error: 'User not found' };
    }

    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return { error: 'Template not found' };
    }

    // Call checkout API
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/checkout`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          sellerId,
          amount: template.price,
        }),
      }
    );

    if (!response.ok) {
      return { error: 'Failed to create checkout session' };
    }

    const { url } = await response.json();
    return { url };
  } catch (error) {
    console.error('Payment initiation error:', error);
    return { error: 'Failed to initiate payment' };
  }
}

export async function getWalletBalance() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return { error: 'Unauthorized' };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    return {
      balance: wallet?.balance || 0,
      lastUpdated: wallet?.updatedAt || new Date(),
    };
  } catch (error) {
    console.error('Get wallet balance error:', error);
    return { error: 'Failed to get wallet balance' };
  }
}

export async function requestWithdrawal(data: {
  amount: number;
  bankAccount: string;
  reason?: string;
}) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return { error: 'Unauthorized' };
    }

    const validated = WithdrawalRequestSchema.parse({
      amount: data.amount,
      bankAccount: data.bankAccount.slice(-4),
    });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet || wallet.balance < validated.amount) {
      return { error: 'Insufficient wallet balance' };
    }

    // Create withdrawal request
    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId: user.id,
        amount: validated.amount,
        bankAccountLastFour: validated.bankAccount,
        reason: data.reason,
        status: 'PENDING',
      },
    });

    // Deduct from wallet immediately (pending release)
    await prisma.wallet.update({
      where: { userId: user.id },
      data: {
        balance: wallet.balance - validated.amount,
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'DEBIT',
        amount: validated.amount,
        description: `Withdrawal request: ${validated.bankAccount}`,
        status: 'PENDING',
        referenceId: withdrawal.id,
      },
    });

    return {
      success: true,
      withdrawalId: withdrawal.id,
      amount: validated.amount,
    };
  } catch (error) {
    console.error('Withdrawal request error:', error);
    if (error instanceof z.ZodError) {
      return { error: 'Invalid withdrawal data' };
    }
    return { error: 'Failed to request withdrawal' };
  }
}

export async function getWithdrawalHistory() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return { error: 'Unauthorized' };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: { userId: user.id },
      orderBy: { requestedAt: 'desc' },
      take: 50,
    });

    return withdrawals;
  } catch (error) {
    console.error('Get withdrawal history error:', error);
    return { error: 'Failed to get withdrawal history' };
  }
}

export async function getTransactionHistory(limit = 50) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return { error: 'Unauthorized' };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return transactions;
  } catch (error) {
    console.error('Get transaction history error:', error);
    return { error: 'Failed to get transaction history' };
  }
}

export async function getEscrowBalance() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return { error: 'Unauthorized' };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    // Calculate total in escrow for freelancer (seller)
    const escrowedSales = await prisma.templatePurchase.findMany({
      where: {
        sellerId: user.id,
        escrowStatus: 'HELD',
      },
    });

    const totalEscrowed = escrowedSales.reduce(
      (sum, sale) => sum + sale.amount,
      0
    );

    return {
      totalEscrowed,
      count: escrowedSales.length,
    };
  } catch (error) {
    console.error('Get escrow balance error:', error);
    return { error: 'Failed to get escrow balance' };
  }
}

export async function getPurchaseHistory() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return { error: 'Unauthorized' };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    const purchases = await prisma.templatePurchase.findMany({
      where: { buyerId: user.id },
      include: {
        template: true,
        seller: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return purchases;
  } catch (error) {
    console.error('Get purchase history error:', error);
    return { error: 'Failed to get purchase history' };
  }
}
