'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useHotelAuth } from '@/contexts/HotelAuthContext';
import AuthLayout from '@/components/auth/AuthLayout';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const hotelLogin = useHotelAuth().login;
  const router = useRouter();
  const redirectTo = searchParams.get('redirect') || null;

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) setError(decodeURIComponent(err));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    let userAuthError: string | null = null;
    try {
      try {
        await login(email, password);
        router.push(redirectTo || '/dashboard');
        return;
      } catch (err) {
        // Store the real user-auth error, then attempt hotel login
        userAuthError = err instanceof Error ? err.message : 'Login failed';
      }
      await hotelLogin(email, password);
      router.push(redirectTo || '/hotel/dashboard');
    } catch (err) {
      // Both user and hotel login failed — show the user-auth error (more relevant)
      const msg = userAuthError ?? (err instanceof Error ? err.message : 'Login failed');
      setError(msg === 'Failed to fetch' ? 'Cannot reach the server. If this is the live site, ensure NEXT_PUBLIC_API_URL is set to https://api.busybeds.com/api/v1 and redeploy.' : msg);
    } finally {
      setLoading(false);
    }
  };

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const baseUrl = apiBase.replace('/api/v1', '');
  const handleGoogleLogin = () => {
    const returnTo = redirectTo || '/dashboard';
    window.location.href = `${baseUrl}/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
  };
  const handleLinkedInLogin = () => {
    const returnTo = redirectTo || '/dashboard';
    window.location.href = `${baseUrl}/auth/linkedin?returnTo=${encodeURIComponent(returnTo)}`;
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account"
      switchText="Don't have an account?"
      switchLink="/register"
      switchLabel="Register"
      hideTopButton
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800/50 p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Your Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-border bg-background text-primary focus:ring-primary"
            />
            <span className="text-sm text-muted">Remember Me</span>
          </label>
          <Link href="/forgot-password" className="text-sm text-muted hover:text-primary transition-colors">
            Forgot Password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-card px-3 text-muted">Or continue with</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-black/5 dark:bg-zinc-800/50 py-2.5 font-medium text-foreground hover:bg-black/10 dark:hover:bg-zinc-700/50 transition-colors"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={handleLinkedInLogin}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-black/5 dark:bg-zinc-800/50 py-2.5 font-medium text-foreground hover:bg-black/10 dark:hover:bg-zinc-700/50 transition-colors"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="#0A66C2">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-muted">Loading...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
