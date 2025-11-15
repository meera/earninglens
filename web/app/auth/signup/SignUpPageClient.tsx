'use client';

import { Suspense } from 'react';
import { SignUpForm } from '@/components/auth/SignUpForm';

export function SignUpPageClient() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
      <SignUpForm />
    </Suspense>
  );
}
