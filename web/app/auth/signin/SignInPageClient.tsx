'use client';

import { Suspense } from 'react';
import { SignInForm } from '@/components/auth/SignInForm';

export function SignInPageClient() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
