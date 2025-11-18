'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export function UserProfileMenu() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  if (isPending) {
    return (
      <div className="h-10 w-10 rounded-full bg-background-muted animate-pulse" />
    );
  }

  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors text-sm"
      >
        Sign In
      </Link>
    );
  }

  const user = session.user;
  const displayName = user.name || user.email.split('@')[0];

  return (
    <DropdownMenu
      trigger={
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <Avatar
            src={user.image}
            alt={displayName}
            fallback={displayName}
          />
        </div>
      }
    >
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-medium text-text-primary">{displayName}</p>
        <p className="text-xs text-text-tertiary truncate">{user.email}</p>
      </div>

      <DropdownMenuItem onClick={() => router.push('/settings')}>
        Settings
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={handleSignOut} className="text-danger">
        Sign Out
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
