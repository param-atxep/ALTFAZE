import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

interface RazorpayPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  notes?: Record<string, string>;
}

interface RazorpayEvent {
  event: string;
  payload: {
    payment: {
      entity: RazorpayPayment;
    };
  };
}

// Track processed payments to prevent duplicate processing
const processedPayments = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      logger.warn('Razorpay webhook: missing signature');
      return NextResponse.json({ error: 'Missing Razorpay signature' }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error('Razorpay webhook secret not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
    }

    const valid = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);
    if (!valid) {
      logger.warn('Invalid Razorpay webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody) as RazorpayEvent;
    const paymentId = event.payload.payment.entity.id;

    logger.info('Razorpay webhook received', { event: event.event, paymentId });

    // Prevent duplicate processing
    if (processedPayments.has(paymentId)) {
      logger.info('Razorpay webhook: duplicate payment ignored', { paymentId });
      return NextResponse.json({ received: true });
    }

    // Handle payment success
    if (event.event === 'payment.authorized' || event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;

      if (payment.status === 'captured') {
        const notes = payment.notes || {};
        const templateId = notes.templateId;
        const orderId = notes.orderId;
        const clientId = notes.clientId;
        const freelancerId = notes.freelancerId;

        processedPayments.add(paymentId);

        // Template purchase flow
        if (templateId && clientId) {
          const template = await db.template.findUnique({
            where: { id: templateId },
          });

          if (!template) {
            logger.error('Template not found', { templateId });
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
          }

          // Create template purchase
          const purchase = await db.templatePurchase.create({
            data: {
              templateId,
              buyerId: clientId,
              sellerId: template.creatorId,
              amount: payment.amount / 100,
              paymentStatus: 'SUCCEEDED',
              razorpayPaymentId: paymentId,
            },
          });

          // Credit seller wallet
          let sellerWallet = await db.wallet.findUnique({
            where: { userId: template.creatorId },
          });

          if (!sellerWallet) {
            sellerWallet = await db.wallet.create({
              data: {
                userId: template.creatorId,
                balance: payment.amount / 100,
              },
            });
          } else {
            await db.wallet.update({
              where: { userId: template.creatorId },
              data: { balance: { increment: payment.amount / 100 } },
            });
          }

          // Create transaction for seller
          await db.transaction.create({
            data: {
              userId: template.creatorId,
              type: 'CREDIT',
              amount: payment.amount / 100,
              description: `Template purchase: ${template.title}`,
              referenceId: purchase.id,
              status: 'SUCCEEDED',
            },
          });

          // Create transaction for buyer
          await db.transaction.create({
            data: {
              userId: clientId,
              type: 'DEBIT',
              amount: payment.amount / 100,
              description: `Purchased template: ${template.title}`,
              referenceId: purchase.id,
              status: 'SUCCEEDED',
            },
          });

          // Notify both parties
          await db.notification.create({
            data: {
              userId: clientId,
              type: 'PURCHASE_COMPLETED',
              message: `You purchased "${template.title}"`,
              actionUrl: `/templates/${template.id}`,
            },
          });

          await db.notification.create({
            data: {
              userId: template.creatorId,
              type: 'TEMPLATE_SOLD',
              message: `Your template "${template.title}" was purchased!`,
              actionUrl: `/seller/sales`,
            },
          });

          logger.info('Template purchase completed', {
            purchaseId: purchase.id,
            templateId,
            paymentId,
            amount: payment.amount / 100,
          });
        }

        // Project order flow
        if (orderId && clientId && freelancerId) {
          const order = await db.order.findUnique({
            where: { id: orderId },
          });

          if (!order) {
            logger.error('Order not found', { orderId });
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
          }

          // Update order payment status
          await db.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'SUCCEEDED',
              escrowStatus: 'HELD',
              razorpayPaymentId: paymentId,
              paidAt: new Date(),
            },
          });

          // Create transaction for escrow hold
          await db.transaction.create({
            data: {
              userId: clientId,
              type: 'DEBIT',
              amount: order.amount,
              description: `Order ${orderId} - Escrow hold`,
              referenceId: orderId,
              status: 'SUCCEEDED',
            },
          });

          // Notify freelancer that payment received
          await db.notification.create({
            data: {
              userId: freelancerId,
              type: 'PAYMENT_RECEIVED',
              message: `Payment of $${order.amount} received for order ${orderId}. Start work!`,
              actionUrl: `/orders/${orderId}`,
            },
          });

          logger.info('Order payment confirmed', {
            orderId,
            paymentId,
            amount: order.amount,
          });
        }
      }
    }

    // Handle payment failure
    if (event.event === 'payment.failed') {
      const notes = event.payload.payment.entity.notes || {};
      const orderId = notes.orderId;
      const clientId = notes.clientId;

      if (orderId && clientId) {
        await db.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'FAILED' },
        });

        await db.notification.create({
          data: {
            userId: clientId,
            type: 'PAYMENT_FAILED',
            message: `Payment for order ${orderId} failed. Please retry.`,
            actionUrl: `/orders/${orderId}`,
          },
        });

        logger.warn('Payment failed', { orderId, paymentId });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Razorpay webhook error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
