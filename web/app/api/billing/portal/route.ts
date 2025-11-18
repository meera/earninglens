import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

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

    // Get user's Stripe customer ID from database
    // Better Auth Stripe plugin automatically stores this
    const result = await db.execute(sql`
      SELECT stripe_customer_id
      FROM user
      WHERE id = ${session.user.id}
    `);

    const stripeCustomerId = (result[0] as any)?.stripe_customer_id;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Create Stripe Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    // Redirect to Stripe Customer Portal
    return NextResponse.redirect(portalSession.url);
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
