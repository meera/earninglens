'use client';

import { createAuthClient } from 'better-auth/react';
import { organizationClient, oneTapClient } from 'better-auth/client/plugins';
// import { stripeClient } from '@better-auth/stripe/client';  // TODO: Enable when implementing monetization

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  plugins: [
    oneTapClient({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      autoSelect: true,  // Auto-select returning users
      cancelOnTapOutside: false,  // Don't dismiss on outside click
    }),
    organizationClient(),  // Organization management
    // stripeClient(),     // TODO: Enable when implementing monetization
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  useActiveOrganization,
  useListOrganizations,
  organization,
  // subscription,  // TODO: Enable when Stripe plugin is fully configured
  oneTap,
} = authClient;
