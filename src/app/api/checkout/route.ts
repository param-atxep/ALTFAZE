import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { rateLimit, createRateLimitResponse } from '@/lib/security';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const checkoutSchema = z.object({
  templateId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const rateLimitResult = rateLimit(req, 'checkout', {
    limit: 5,
    windowMs: 60 * 1000,
  });

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult, {
      limit: 5,
      windowMs: 60 * 1000,
    });
  }

  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Payment provider not configured' }, { status: 503 });
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = checkoutSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { templateId } = body.data;

    const buyer = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        creator: true,
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (template.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Template is not available for purchase' }, { status: 403 });
    }

    if (template.creatorId === buyer.id) {
      return NextResponse.json({ error: 'Cannot purchase your own template' }, { status: 400 });
    }

    let stripeCustomerId = buyer.stripeCustomerId;

    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: buyer.email!,
        name: buyer.name || undefined,
      });
      stripeCustomerId = stripeCustomer.id;

      await prisma.user.update({
        where: { id: buyer.id },
        data: { stripeCustomerId },
      });
    }

    const existingPurchase = await prisma.templatePurchase.findFirst({
      where: {
        templateId,
        buyerId: buyer.id,
        paymentStatus: {
          in: ['PENDING', 'SUCCEEDED'],
        },
      },
    });

    if (existingPurchase?.paymentStatus === 'SUCCEEDED') {
      return NextResponse.json({ error: 'Template already purchased' }, { status: 409 });
    }

    const templatePurchase = existingPurchase || await prisma.templatePurchase.create({
      data: {
        templateId,
        buyerId: buyer.id,
        sellerId: template.creatorId,
        amount: template.price,
        paymentStatus: 'PENDING',
        escrowStatus: 'HELD',
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: template.title,
              description: template.description.substring(0, 500),
              images: template.imageUrl ? [template.imageUrl] : undefined,
            },
            unit_amount: Math.round(template.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/templates/${template.slug}?success=true`,
      cancel_url: `${appUrl}/templates/${template.slug}?cancelled=true`,
      metadata: {
        templatePurchaseId: templatePurchase.id,
        buyerId: buyer.id,
        sellerId: template.creatorId,
        templateId,
      },
    });

    await prisma.templatePurchase.update({
      where: { id: templatePurchase.id },
      data: {
        stripeSessionId: checkoutSession.id,
        sellerId: template.creatorId,
        amount: template.price,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    logger.error('Checkout error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
