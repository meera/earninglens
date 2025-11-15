'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Mail, RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface SignInFormProps {
  prefilledEmail?: string;
  redirectUrl?: string;
  callbackURL?: string;
  showSignUpLink?: boolean;
  title?: string;
  submitButtonText?: string;
}

export function SignInForm({
  prefilledEmail,
  redirectUrl = '/',
  callbackURL = '/',
  showSignUpLink = true,
  title = 'Sign in to your account',
  submitButtonText = 'Sign In',
}: SignInFormProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDev = process.env.NODE_ENV === 'development';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(isDev ? 'TestPassword123' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  const showVerificationBanner = searchParams?.get('verify') === 'true';

  useEffect(() => {
    const emailToUse = prefilledEmail || searchParams?.get('email') || (isDev ? 'test@markethawkeye.com' : '');
    setEmail(emailToUse);
  }, [prefilledEmail, searchParams, isDev]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn.email({
        email,
        password,
        callbackURL: redirectUrl,
      }, {
        onRequest: () => {
          setIsLoading(true);
        },
        onSuccess: () => {
          router.push(redirectUrl);
        },
        onError: (ctx) => {
          setIsLoading(false);
          if (ctx.error.status === 403) {
            setError('Please verify your email address first');
            setNeedsEmailVerification(true);
          } else {
            setError('Invalid email or password. Please try again.');
            setNeedsEmailVerification(false);
          }
        },
      });
    } catch (err) {
      setIsLoading(false);
      setError('An error occurred. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    setIsResendingVerification(true);

    try {
      // Better Auth's email verification resend
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, callbackURL }),
      });

      if (response.ok) {
        setError('');
        setTimeout(() => {
          setError('✓ Verification email sent! Please check your inbox and spam folder.');
        }, 100);
        setTimeout(() => setError(''), 5000);
      } else {
        setError('Failed to resend verification email. Please try again.');
      }
    } catch (err) {
      console.error('Error resending verification:', err);
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      await signIn.social({
        provider: 'google',
        callbackURL,
      });
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-text-primary mb-1">{title}</h3>
      </div>

      {/* Email Verification Banner */}
      {(showVerificationBanner || needsEmailVerification) && email && (
        <div className="p-4 text-sm bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-green-800 font-medium mb-1">
                📧 Check your email to continue
              </div>
              <div className="text-green-700 mb-2">
                We sent a verification link to <strong>{email}</strong> - click it to complete your sign-in!
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResendVerification}
                disabled={isResendingVerification}
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                {isResendingVerification ? (
                  <>
                    <div className="h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    <span>Resend verification email</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !needsEmailVerification && (
        <div className={`p-4 text-sm rounded-lg border ${
          error.startsWith('✓')
            ? 'text-green-600 bg-green-50 border-green-200'
            : 'text-red-600 bg-red-50 border-red-200'
        }`}>
          {error}
        </div>
      )}

      {/* Google Sign In */}
      <form onSubmit={(e) => { e.preventDefault(); handleGoogleSignIn(); }}>
        <button
          type="submit"
          disabled={isGoogleLoading}
          className={`w-full flex items-center justify-center gap-2 bg-white border border-border rounded-lg py-3 text-text-primary font-medium transition-all ${
            isGoogleLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-background-muted'
          }`}
        >
          {isGoogleLoading ? (
            <>
              <div className="h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm uppercase">
          <span className="bg-white px-4 text-text-tertiary">Or continue with email</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form className="space-y-4" onSubmit={handleSignIn}>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="email" className="block text-sm font-medium text-text-primary">
              Email
            </label>
            {(showVerificationBanner || needsEmailVerification) && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Unverified</span>
            )}
          </div>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
            disabled={isLoading}
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="block text-sm font-medium text-text-primary">
              Password
            </label>
            <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pr-12"
              disabled={isLoading}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Signing in...</span>
            </>
          ) : (
            submitButtonText
          )}
        </Button>
      </form>

      {/* Sign Up Link */}
      {showSignUpLink && (
        <div className="text-center text-base text-text-secondary mt-6 pt-4 border-t border-border">
          <p className="mb-2">Don't have an account?</p>
          <Link href="/auth/signup" className="font-medium text-primary hover:underline transition-colors">
            Sign up
          </Link>
        </div>
      )}
    </div>
  );
}
