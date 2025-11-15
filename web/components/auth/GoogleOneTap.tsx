'use client';

import { useEffect, useState } from 'react';
import { useSession, oneTap } from '@/lib/auth-client';

/**
 * Google One Tap Component
 * Uses Better Auth's built-in One Tap plugin
 */
export function GoogleOneTap() {
  const { data: session, isPending } = useSession();
  const [initialized, setInitialized] = useState(false);

  console.log('GoogleOneTap component rendered', { session, isPending, initialized });

  useEffect(() => {
    // Don't initialize if:
    // - Session is still loading
    // - User is already logged in
    // - Already initialized
    if (isPending || session || initialized) return;

    console.log('Initializing Google One Tap...');

    // Initialize Better Auth One Tap
    const initOneTap = async () => {
      try {
        setInitialized(true);

        await oneTap({
          callbackURL: '/',
          onPromptNotification: (notification: any) => {
            console.log('One Tap notification:', notification);
          },
          fetchOptions: {
            onSuccess: () => {
              console.log('Sign-in successful!');
              window.location.reload();
            },
            onError: (error) => {
              console.error('One Tap sign-in error:', error);
              setInitialized(false); // Allow retry on error
            },
          },
        });

        console.log('Google One Tap initialized successfully');
      } catch (error) {
        console.error('Failed to initialize One Tap:', error);
        setInitialized(false); // Allow retry on error
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initOneTap();
    }, 1000);

    return () => clearTimeout(timer);
  }, [session, isPending, initialized]);

  // This component doesn't render anything visible
  return null;
}
