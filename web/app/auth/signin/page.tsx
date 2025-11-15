import { Metadata } from 'next';
import { SignInPageClient } from './SignInPageClient';

export const metadata: Metadata = {
  title: 'Sign In - Markey HawkEye',
  description: 'Sign in to your Markey HawkEye account to access earnings call videos and analytics',
};

export default function SignInPage() {
  return <SignInPageClient />;
}
