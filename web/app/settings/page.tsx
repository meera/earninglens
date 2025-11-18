'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from '@/lib/auth-client';
import { Avatar } from '@/components/ui/avatar';
import { Logo } from '@/components/Logo';

export default function SettingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/signin');
    }
  }, [session, isPending, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-tertiary">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user;
  const displayName = user.name || user.email.split('@')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-elevated to-background">
      {/* Header */}
      <header className="border-b border-border backdrop-blur-sm bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <Link
              href="/"
              className="text-text-tertiary hover:text-primary transition-colors text-sm"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Settings</h1>

        {/* Profile Section */}
        <div className="bg-background-elevated border border-border rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Profile</h2>

          <div className="flex items-center gap-6 mb-6">
            <Avatar
              src={user.image}
              alt={displayName}
              fallback={displayName}
              className="h-20 w-20"
            />
            <div>
              <p className="text-sm text-text-tertiary mb-1">Profile Picture</p>
              <p className="text-text-secondary text-sm">
                {user.image ? `Using Google profile image` : `Showing initials`}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-tertiary mb-2">
                Name
              </label>
              <div className="px-4 py-3 bg-background-muted border border-border rounded-lg text-text-primary">
                {user.name || 'Not set'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-tertiary mb-2">
                Email
              </label>
              <div className="px-4 py-3 bg-background-muted border border-border rounded-lg text-text-primary">
                {user.email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-tertiary mb-2">
                Email Verified
              </label>
              <div className="px-4 py-3 bg-background-muted border border-border rounded-lg">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.emailVerified
                      ? `bg-success/10 text-success`
                      : `bg-warning/10 text-warning`
                  }`}
                >
                  {user.emailVerified ? `Verified` : `Not Verified`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-background-elevated border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Account</h2>

          <button
            onClick={handleSignOut}
            className="w-full px-4 py-3 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 rounded-lg font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
