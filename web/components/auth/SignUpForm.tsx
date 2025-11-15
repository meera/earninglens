'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

interface SignUpFormProps {
  callbackURL?: string;
  redirectAfterSignup?: string;
  showSignInLink?: boolean;
  title?: string;
  submitButtonText?: string;
}

export function SignUpForm({
  callbackURL = '/',
  redirectAfterSignup = '/auth/signin',
  showSignInLink = true,
  title = 'Create your account',
  submitButtonText = 'Sign Up',
}: SignUpFormProps = {}) {
  const router = useRouter();
  const isDev = process.env.NODE_ENV === 'development';

  const [email, setEmail] = useState(isDev ? 'test@markethawkeye.com' : '');
  const [password, setPassword] = useState(isDev ? 'TestPassword123' : '');
  const [name, setName] = useState(isDev ? 'Test User' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await signUp.email({
        email,
        password,
        name,
        callbackURL,
      }, {
        onRequest: () => {
          setIsLoading(true);
        },
        onSuccess: () => {
          setIsLoading(false);
          setSuccess('Account created! Please check your email to verify your account.');
          setTimeout(() => {
            router.push(`${redirectAfterSignup}?email=${encodeURIComponent(email)}&verify=true`);
          }, 2000);
        },
        onError: (ctx) => {
          setIsLoading(false);
          if (ctx.error.message.toLowerCase().includes('user already exists') ||
              ctx.error.message.toLowerCase().includes('email already in use')) {
            setError('We found an existing account with this email. Please sign in instead.');
          } else {
            setError(ctx.error.message);
          }
        },
      });
    } catch (err) {
      setIsLoading(false);
      setError('An error occurred during sign up. Please try again.');
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      await signIn.social({
        provider: 'google',
        callbackURL,
      });
    } catch (err) {
      setError('Google sign-up failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-text-primary mb-1">{title}</h3>
      </div>

      {success && (
        <div className="p-4 mb-6 text-center bg-green-50 border border-green-200 rounded-lg">
          <div className="text-green-600 text-2xl mb-2">✅</div>
          <p className="text-green-800 font-medium text-base mb-1">{success}</p>
          <p className="text-green-600 text-sm">Redirecting to sign in...</p>
        </div>
      )}

      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleGoogleSignUp(); }}>
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
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm uppercase">
          <span className="bg-white px-4 text-text-tertiary">Or continue with email</span>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSignUp}>
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-text-primary">Name</label>
          <Input id="name" type="text" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full" disabled={isLoading} autoComplete="name" required />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-text-primary">Email</label>
          <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full" disabled={isLoading} autoComplete="email" required />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-text-primary">Password</label>
          <div className="relative">
            <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Create a password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pr-12" disabled={isLoading} autoComplete="new-password" minLength={8} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors" disabled={isLoading}>
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-xs text-text-tertiary">Use 8+ characters with a mix of letters, numbers & symbols</p>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Creating account...</span>
            </>
          ) : (
            submitButtonText
          )}
        </Button>
      </form>

      <p className="text-xs text-center text-text-tertiary">
        By signing up, you agree to our <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
      </p>

      {showSignInLink && (
        <div className="text-center text-base text-text-secondary mt-6 pt-4 border-t border-border">
          <p className="mb-2">Already have an account?</p>
          <Link href="/auth/signin" className="font-medium text-primary hover:underline transition-colors">Sign in</Link>
        </div>
      )}
    </div>
  );
}
