'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { user as userTable, organization as organizationTable } from '@/lib/db/auth-schema';
import { eq } from 'drizzle-orm';

/**
 * Access tier type
 */
export type AccessTier = 'free' | 'pro' | 'team';

/**
 * User access permissions
 */
export interface UserAccess {
  tier: AccessTier;
  canWatchFullVideos: boolean;
  canInteractWithCharts: boolean;
  canDownloadTranscripts: boolean;
  canAccessAPI: boolean;
  isAuthenticated: boolean;
}

/**
 * Get user's access level
 * Returns combined access from personal subscription AND organization membership
 */
export async function getUserAccess(): Promise<UserAccess> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Unauthenticated users: free tier only
  if (!session?.user) {
    return {
      tier: 'free',
      canWatchFullVideos: false,
      canInteractWithCharts: false,
      canDownloadTranscripts: false,
      canAccessAPI: false,
      isAuthenticated: false,
    };
  }

  // Check personal subscription
  // Note: In production, this would be cached in user.metadata
  // For now, we'll check the subscription via Better Auth
  let hasProPersonal = false;
  try {
    // TODO: Query Stripe via Better Auth to get subscription status
    // For MVP, we'll use a metadata field on user table
    const user = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, session.user.id),
    });
    // Assuming we cache subscription tier in user metadata
    hasProPersonal = user?.metadata?.subscriptionTier === 'pro';
  } catch (error) {
    console.error('Failed to get user subscription:', error);
  }

  // Check organization subscription
  let hasTeamOrg = false;
  if (session.activeOrganizationId) {
    try {
      const org = await db.query.organization.findFirst({
        where: (org, { eq }) => eq(org.id, session.activeOrganizationId),
      });
      hasTeamOrg = org?.metadata?.subscriptionTier === 'team';
    } catch (error) {
      console.error('Failed to get organization subscription:', error);
    }
  }

  // User has Pro access if they have EITHER Pro personal OR Team org
  const tier: AccessTier = hasTeamOrg ? 'team' : hasProPersonal ? 'pro' : 'free';

  return {
    tier,
    canWatchFullVideos: hasProPersonal || hasTeamOrg,
    canInteractWithCharts: hasProPersonal || hasTeamOrg,
    canDownloadTranscripts: hasProPersonal || hasTeamOrg,
    canAccessAPI: hasTeamOrg, // Team-only feature
    isAuthenticated: true,
  };
}

/**
 * Check if user can watch full video
 */
export async function canWatchFullVideo(videoId: string) {
  const access = await getUserAccess();

  return {
    canWatch: access.canWatchFullVideos,
    tier: access.tier,
    isAuthenticated: access.isAuthenticated,
  };
}

/**
 * Check if user can interact with charts
 */
export async function canInteractWithCharts() {
  const access = await getUserAccess();

  return {
    canInteract: access.canInteractWithCharts,
    tier: access.tier,
  };
}

/**
 * Check if user can download transcript
 */
export async function canDownloadTranscript(videoId: string) {
  const access = await getUserAccess();

  return {
    canDownload: access.canDownloadTranscripts,
    tier: access.tier,
  };
}

/**
 * Track video view (analytics)
 */
export async function trackVideoView(videoId: string, data: {
  durationWatched?: number;
  progressPercent?: number;
  source?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  try {
    // TODO: Insert into videoViews table
    // For now, just log
    console.log('Video view tracked:', {
      videoId,
      userId: session?.user?.id || 'anonymous',
      ...data,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to track video view:', error);
    return {
      error: 'Failed to track view',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Track video engagement event (paywall hit, chart interaction, etc.)
 */
export async function trackEngagement(videoId: string, eventType: string, data: Record<string, any>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  try {
    // TODO: Insert into videoEngagement table
    console.log('Engagement tracked:', {
      videoId,
      userId: session?.user?.id || 'anonymous',
      eventType,
      ...data,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to track engagement:', error);
    return {
      error: 'Failed to track engagement',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Track paywall hit (for analytics)
 */
export async function trackPaywallHit(videoId: string, progressPercent: number) {
  return trackEngagement(videoId, 'paywall_hit', { progressPercent });
}

/**
 * Track chart interaction
 */
export async function trackChartInteraction(videoId: string, chartType: string) {
  return trackEngagement(videoId, 'chart_interact', { chartType });
}

/**
 * Track download attempt
 */
export async function trackDownloadAttempt(videoId: string, fileType: string) {
  return trackEngagement(videoId, 'download_attempt', { fileType });
}
