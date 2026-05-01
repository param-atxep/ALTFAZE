import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface CheckoutRequest {
  templateId: string;
  sellerId: string;
  amount: number;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CheckoutRequest = await req.json();
    const { templateId, sellerId, amount } = body;

    if (!templateId || !sellerId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Verify seller exists
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Get buyer info
    const buyer = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer not found' },
        { status: 404 }
      );
    }

    // Create or get Stripe customer for buyer
    let stripeCustomerId = buyer.stripeCustomerId;

    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: buyer.email!,
        name: buyer.name || undefined,
      });
      stripeCustomerId = stripeCustomer.id;

      // Save stripe customer ID
      await prisma.user.update({
        where: { id: buyer.id },
        data: { stripeCustomerId },
      });
    }

    // Create template purchase record
    const templatePurchase = await prisma.templatePurchase.create({
      data: {
        templateId,
        buyerId: buyer.id,
        sellerId,
        amount,
        paymentStatus: 'PENDING',
        escrowStatus: 'HELD',
      },
    });

    // Create checkout session
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
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/templates/${templateId}?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/templates/${templateId}?cancelled=true`,
      metadata: {
        templatePurchaseId: templatePurchase.id,
        buyerId: buyer.id,
        sellerId,
        templateId,
      },
    });

    // Update purchase with session ID
    await prisma.templatePurchase.update({
      where: { id: templatePurchase.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
