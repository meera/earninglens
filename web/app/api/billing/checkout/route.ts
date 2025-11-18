import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import Stripe from 'stripe';

// Stripe initialization will fail at build time if not configured
// This is intentional - Stripe is required for this application
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.redirect(new URL('/api/auth/google-one-tap', request.url));
    }

    // Get plan from query params
    const searchParams = request.nextUrl.searchParams;
    const plan = searchParams.get('plan'); // 'pro' or 'team'
    const billingPeriod = searchParams.get('period') || 'monthly'; // 'monthly' or 'yearly'

    if (!plan || !['pro', 'team'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get price ID from environment
    const priceIdKey = `STRIPE_${plan.toUpperCase()}_${billingPeriod.toUpperCase()}_PRICE_ID`;
    const priceId = process.env[priceIdKey];

    if (!priceId) {
      console.error(`Missing price ID: ${priceIdKey}`);
      return NextResponse.json({ error: 'Price configuration error' }, { status: 500 });
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: session.user.email,
      client_reference_id: session.user.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId: session.user.id,
        plan,
        billingPeriod,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          plan,
          billingPeriod,
        },
      },
      // Enable customer portal access
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      // Tax calculation
      automatic_tax: {
        enabled: true,
      },
    });

    // Redirect to Stripe Checkout
    return NextResponse.redirect(checkoutSession.url!);
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
