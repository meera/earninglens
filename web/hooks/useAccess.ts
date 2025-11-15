'use client';

import { useSession, useActiveOrganization } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import { getUserAccess, type UserAccess } from '@/app/actions/videoActions';

/**
 * useAccess Hook
 *
 * Client-side hook to check user's access level.
 * Returns permissions based on personal subscription AND organization membership.
 */
export function useAccess() {
  const { data: session, isPending } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const [access, setAccess] = useState<UserAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAccess() {
      try {
        const result = await getUserAccess();
        setAccess(result);
      } catch (error) {
        console.error('Failed to get user access:', error);
        setAccess({
          tier: 'free',
          canWatchFullVideos: false,
          canInteractWithCharts: false,
          canDownloadTranscripts: false,
          canAccessAPI: false,
          isAuthenticated: false,
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (!isPending) {
      fetchAccess();
    }
  }, [session, activeOrg, isPending]);

  return {
    ...access,
    isLoading: isLoading || isPending,
  };
}

/**
 * usePaywall Hook - Helper for paywall trigger logic
 */
export function usePaywall() {
  const { canWatchFullVideos, tier } = useAccess();

  const shouldShowPaywall = (progressPercent: number) => {
    if (!canWatchFullVideos && progressPercent >= 50) {
      return true;
    }
    return false;
  };

  return {
    shouldShowPaywall,
    paywallThreshold: canWatchFullVideos ? 100 : 50,
    tier,
  };
}

/**
 * useUpgradePrompt Hook - Returns upgrade messaging
 */
export function useUpgradePrompt() {
  const { isAuthenticated, tier } = useAccess();

  if (!isAuthenticated) {
    return {
      upgradeMessage: 'Sign in to watch more',
      upgradeCTA: 'Sign In',
      upgradeAction: 'sign-in',
    };
  }

  if (tier === 'free') {
    return {
      upgradeMessage: 'Upgrade to Pro to watch the full earnings call',
      upgradeCTA: 'Upgrade to Pro - $29/month',
      upgradeAction: 'upgrade-pro',
    };
  }

  return {
    upgradeMessage: 'Continue watching',
    upgradeCTA: 'Continue',
    upgradeAction: 'continue',
  };
}
