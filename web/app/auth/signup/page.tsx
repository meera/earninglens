import { Metadata } from 'next';
import { SignUpPageClient } from './SignUpPageClient';

export const metadata: Metadata = {
  title: 'Sign Up - Markey HawkEye',
  description: 'Create your Markey HawkEye account to access earnings call videos and analytics',
};

export default function SignUpPage() {
  return <SignUpPageClient />;
}
