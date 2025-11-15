'use server';

import { auth } from '@/lib/auth';
import { authClient } from '@/lib/auth-client';
import { headers } from 'next/headers';

/**
 * Upgrade user to Pro personal subscription
 * Reference ID: user.id (personal subscription)
 */
export async function upgradeToProPersonal() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  try {
    // Create Stripe checkout session for personal Pro subscription
    const result = await authClient.subscription.upgrade({
      plan: 'pro',
      referenceId: session.user.id, // Personal subscription
    });

    return {
      success: true,
      checkoutUrl: result.checkoutUrl,
    };
  } catch (error) {
    console.error('Upgrade to Pro failed:', error);
    return {
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upgrade organization to Team subscription
 * Reference ID: organization.id (team subscription)
 */
export async function upgradeOrganizationToTeam(organizationId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  // Authorization check: only organization owners can upgrade
  // This is also enforced by Better Auth authorizeReference hook,
  // but we check here for better error messages
  const member = await auth.api.getOrganizationMember({
    organizationId,
    userId: session.user.id,
  });

  if (!member || member.role !== 'owner') {
    return {
      error: 'Unauthorized',
      message: 'Only organization owners can manage billing',
    };
  }

  try {
    // Create Stripe checkout session for Team subscription
    const result = await authClient.subscription.upgrade({
      plan: 'team',
      referenceId: organizationId, // Organization subscription
      seats: 10, // Team plan includes 10 seats
    });

    return {
      success: true,
      checkoutUrl: result.checkoutUrl,
    };
  } catch (error) {
    console.error('Upgrade to Team failed:', error);
    return {
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get active subscription for current user
 * Returns both personal and organization subscriptions
 */
export async function getActiveSubscription() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  try {
    // Get personal subscription
    const personalSub = await authClient.subscription.list({
      referenceId: session.user.id,
    });

    // Get organization subscription (if user has active org)
    let orgSub = null;
    if (session.activeOrganizationId) {
      orgSub = await authClient.subscription.list({
        referenceId: session.activeOrganizationId,
      });
    }

    return {
      success: true,
      personal: personalSub,
      organization: orgSub,
      activeOrganizationId: session.activeOrganizationId,
    };
  } catch (error) {
    console.error('Failed to get subscriptions:', error);
    return {
      error: 'Failed to retrieve subscription information',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancel personal subscription
 */
export async function cancelPersonalSubscription() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  try {
    await authClient.subscription.cancel({
      referenceId: session.user.id,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    return {
      error: 'Failed to cancel subscription',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancel organization subscription (owner only)
 */
export async function cancelOrganizationSubscription(organizationId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  // Check if user is owner
  const member = await auth.api.getOrganizationMember({
    organizationId,
    userId: session.user.id,
  });

  if (!member || member.role !== 'owner') {
    return {
      error: 'Unauthorized',
      message: 'Only organization owners can cancel subscriptions',
    };
  }

  try {
    await authClient.subscription.cancel({
      referenceId: organizationId,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to cancel organization subscription:', error);
    return {
      error: 'Failed to cancel subscription',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get Stripe billing portal URL
 */
export async function getBillingPortalUrl() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  try {
    // Better Auth Stripe plugin provides billing portal
    const portalUrl = await authClient.subscription.createPortalSession({
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return {
      success: true,
      portalUrl,
    };
  } catch (error) {
    console.error('Failed to create billing portal session:', error);
    return {
      error: 'Failed to create billing portal',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
