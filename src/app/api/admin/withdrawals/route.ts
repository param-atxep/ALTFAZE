import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { withdrawalId, approved } = body;

    if (!withdrawalId || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: { user: true },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      );
    }

    if (approved) {
      // Process payout via Stripe Connect
      // For now, mark as approved and create transaction
      const updatedWithdrawal = await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: 'APPROVED',
          processedAt: new Date(),
        },
      });

      // Update transaction status
      await prisma.transaction.updateMany({
        where: { referenceId: withdrawalId },
        data: { status: 'PENDING' },
      });

      return NextResponse.json({
        success: true,
        withdrawal: updatedWithdrawal,
      });
    } else {
      // Reject and refund to wallet
      const updatedWithdrawal = await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: 'REJECTED',
          processedAt: new Date(),
        },
      });

      // Refund to wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId: withdrawal.userId },
      });

      if (wallet) {
        await prisma.wallet.update({
          where: { userId: withdrawal.userId },
          data: {
            balance: wallet.balance + withdrawal.amount,
          },
        });
      }

      // Update transaction status
      await prisma.transaction.updateMany({
        where: { referenceId: withdrawalId },
        data: { status: 'FAILED' },
      });

      return NextResponse.json({
        success: true,
        withdrawal: updatedWithdrawal,
      });
    }
  } catch (error) {
    console.error('Withdrawal approval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
