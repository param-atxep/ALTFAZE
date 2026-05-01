import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const templatePurchaseId = session.metadata?.templatePurchaseId;
  const buyerId = session.metadata?.buyerId;
  const sellerId = session.metadata?.sellerId;
  const templateId = session.metadata?.templateId;
  const amount = session.amount_total ? session.amount_total / 100 : 0;

  if (!templatePurchaseId || !buyerId || !sellerId) {
    console.error('Missing metadata in checkout session');
    return;
  }

  try {
    // Update template purchase with payment intent ID
    const paymentIntent = session.payment_intent as string;

    await prisma.templatePurchase.update({
      where: { id: templatePurchaseId },
      data: {
        paymentStatus: 'SUCCEEDED',
        stripePaymentIntentId: paymentIntent,
        stripeSessionId: session.id,
        escrowStatus: 'HELD',
      },
    });

    // Create transaction record for buyer (debit)
    await prisma.transaction.create({
      data: {
        userId: buyerId,
        type: 'DEBIT',
        amount: amount,
        description: `Template purchase: ${templateId}`,
        status: 'SUCCEEDED',
        stripePaymentIntentId: paymentIntent,
        referenceId: templatePurchaseId,
      },
    });

    // Create transaction record for seller (credit in escrow)
    await prisma.transaction.create({
      data: {
        userId: sellerId,
        type: 'CREDIT',
        amount: amount,
        description: `Template sale (Escrow): ${templateId}`,
        status: 'SUCCEEDED',
        stripePaymentIntentId: paymentIntent,
        referenceId: templatePurchaseId,
      },
    });

    console.log(`Template purchase ${templatePurchaseId} payment succeeded`);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  const templatePurchaseId = paymentIntent.metadata?.templatePurchaseId;

  if (!templatePurchaseId) {
    console.error('Missing templatePurchaseId in payment intent metadata');
    return;
  }

  try {
    // Release funds from escrow after payment confirmation
    const purchase = await prisma.templatePurchase.findUnique({
      where: { id: templatePurchaseId },
    });

    if (!purchase) return;

    // Update escrow status to released
    await prisma.templatePurchase.update({
      where: { id: templatePurchaseId },
      data: {
        escrowStatus: 'RELEASED',
      },
    });

    // Add funds to seller's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: purchase.sellerId },
    });

    if (wallet) {
      await prisma.wallet.update({
        where: { userId: purchase.sellerId },
        data: {
          balance: wallet.balance + purchase.amount,
        },
      });
    } else {
      // Create wallet if doesn't exist
      await prisma.wallet.create({
        data: {
          userId: purchase.sellerId,
          balance: purchase.amount,
        },
      });
    }

    console.log(
      `Funds released for template purchase ${templatePurchaseId}`
    );
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const templatePurchaseId = paymentIntent.metadata?.templatePurchaseId;

  if (!templatePurchaseId) {
    console.error('Missing templatePurchaseId in payment intent metadata');
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

    console.log(`Payment failed for template purchase ${templatePurchaseId}`);
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}
