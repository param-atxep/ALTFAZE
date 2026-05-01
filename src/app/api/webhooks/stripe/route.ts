import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST(req: NextRequest) {
  try {
    if (!stripe || !webhookSecret) {
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
    }

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      logger.warn('Stripe webhook signature verification failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case 'payment_intent.succeeded': {
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      }
      case 'payment_intent.payment_failed': {
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      }
      default:
        logger.info('Unhandled Stripe event type', { type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const templatePurchaseId = session.metadata?.templatePurchaseId;
  const buyerId = session.metadata?.buyerId;
  const sellerId = session.metadata?.sellerId;
  const templateId = session.metadata?.templateId;
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;
  const amount = session.amount_total ? session.amount_total / 100 : 0;

  if (!templatePurchaseId || !buyerId || !sellerId || !paymentIntentId) {
    logger.warn('Missing Stripe checkout metadata', { templatePurchaseId, buyerId, sellerId });
    return;
  }

  const purchase = await prisma.templatePurchase.findUnique({
    where: { id: templatePurchaseId },
  });

  if (!purchase) {
    logger.warn('Template purchase not found for checkout session', { templatePurchaseId });
    return;
  }

  if (purchase.paymentStatus === 'SUCCEEDED') {
    logger.info('Stripe checkout already processed', { templatePurchaseId });
    return;
  }

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.templatePurchase.update({
        where: { id: templatePurchaseId },
        data: {
          paymentStatus: 'SUCCEEDED',
          stripePaymentIntentId: paymentIntentId,
          stripeSessionId: session.id,
          escrowStatus: 'HELD',
        },
      });

      const existingDebit = await transaction.transaction.findFirst({
        where: {
          referenceId: templatePurchaseId,
          type: 'DEBIT',
        },
      });

      if (!existingDebit) {
        await transaction.transaction.create({
          data: {
            userId: buyerId,
            type: 'DEBIT',
            amount,
            description: `Template purchase: ${templateId}`,
            status: 'SUCCEEDED',
            stripePaymentIntentId: paymentIntentId,
            referenceId: templatePurchaseId,
          },
        });
      }

      const existingCredit = await transaction.transaction.findFirst({
        where: {
          referenceId: templatePurchaseId,
          type: 'CREDIT',
        },
      });

      if (!existingCredit) {
        await transaction.transaction.create({
          data: {
            userId: sellerId,
            type: 'CREDIT',
            amount,
            description: `Template sale (Escrow): ${templateId}`,
            status: 'SUCCEEDED',
            stripePaymentIntentId: paymentIntentId,
            referenceId: templatePurchaseId,
          },
        });
      }
    });

    logger.info('Template purchase payment succeeded', { templatePurchaseId });
  } catch (error) {
    logger.error('Error handling checkout session completed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const templatePurchaseId = paymentIntent.metadata?.templatePurchaseId;

  if (!templatePurchaseId) {
    logger.warn('Missing templatePurchaseId in payment intent metadata');
    return;
  }

  try {
    const purchase = await prisma.templatePurchase.findUnique({
      where: { id: templatePurchaseId },
    });

    if (!purchase || purchase.escrowStatus === 'RELEASED') {
      return;
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.templatePurchase.update({
        where: { id: templatePurchaseId },
        data: { escrowStatus: 'RELEASED' },
      });

      const wallet = await transaction.wallet.findUnique({
        where: { userId: purchase.sellerId },
      });

      if (wallet) {
        await transaction.wallet.update({
          where: { userId: purchase.sellerId },
          data: { balance: wallet.balance + purchase.amount },
        });
      } else {
        await transaction.wallet.create({
          data: {
            userId: purchase.sellerId,
            balance: purchase.amount,
          },
        });
      }
    });

    logger.info('Funds released from escrow', { templatePurchaseId });
  } catch (error) {
    logger.error('Error handling payment intent succeeded', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const templatePurchaseId = paymentIntent.metadata?.templatePurchaseId;

  if (!templatePurchaseId) {
    logger.warn('Missing templatePurchaseId in payment intent metadata');
    return;
  }

  try {
    await prisma.templatePurchase.update({
      where: { id: templatePurchaseId },
      data: {
        paymentStatus: 'FAILED',
        escrowStatus: 'REFUNDED',
      },
    });

    logger.warn('Payment failed for template purchase', { templatePurchaseId });
  } catch (error) {
    logger.error('Error handling payment intent failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
