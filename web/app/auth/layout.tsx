'use client';

import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthMarketingPanel } from '@/components/auth/AuthMarketingPanel';
import { usePathname } from 'next/navigation';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // For invite pages, render without marketing panel
  if (pathname?.includes('/invite')) {
    return children;
  }

  return (
    <div className="flex flex-col min-h-screen w-full max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12">
      {/* Header */}
      <div className="w-full py-4">
        <AuthHeader />
      </div>

      {/* Main Content: Marketing Panel + Form */}
      <div className="flex flex-1 flex-col md:flex-row mx-auto w-full max-w-6xl px-4 lg:px-8">
        {/* Left spacing */}
        <div className="hidden lg:block lg:w-1/12"></div>

        {/* Marketing Panel (hidden on mobile) */}
        <div className="md:w-1/2 lg:w-5/12">
          <AuthMarketingPanel />
        </div>

        {/* Form Panel */}
        <div className="w-full md:w-1/2 lg:w-5/12 flex flex-col p-4 pt-8 bg-gradient-to-br from-blue-50 to-teal-50">
          <div className="w-full max-w-md mx-auto">
            {children}
          </div>
        </div>

        {/* Right spacing */}
        <div className="hidden lg:block lg:w-1/12"></div>
      </div>
    </div>
  );
}
