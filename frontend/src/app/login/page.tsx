'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useHotelAuth } from '@/contexts/HotelAuthContext';
import AuthLayout from '@/components/auth/AuthLayout';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

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
      let isHotelManager = false;
      try {
        await hotelLogin(email, password);
        isHotelManager = true;
      } catch (err) {
        userAuthError = err instanceof Error ? err.message : 'Login failed';
      }

      if (isHotelManager) {
        router.push(redirectTo || '/hotel/dashboard');
        return;
      }

      await login(email, password);
      router.push(redirectTo || '/dashboard');
    } catch (err) {
      const msg = userAuthError ?? (err instanceof Error ? err.message : 'Login failed');
      setError(msg === 'Failed to fetch' ? 'Cannot reach the server.' : msg);
    } finally {
      setLoading(false);
    }
  };

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const baseUrl = apiBase.replace('/api/v1', '');

  const handleSocialLogin = (provider: 'google' | 'linkedin') => {
    const returnTo = redirectTo || '/dashboard';
    window.location.href = `${baseUrl}/auth/${provider}?returnTo=${encodeURIComponent(returnTo)}`;
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your Busy Beds account"
      switchText="Don't have an account?"
      switchLink="/register"
      switchLabel="Join Now"
      hideTopButton
    >
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 p-4 text-sm text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-foreground/80 px-1">
              Work Email
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                <Mail size={18} />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full rounded-xl border border-border bg-background/50 pl-11 pr-4 py-3 text-foreground placeholder:text-muted/60 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <label htmlFor="password" className="text-sm font-semibold text-foreground/80">
                Password
              </label>
              <Link href="/forgot-password" title="Recover password" className="text-xs font-semibold text-primary hover:text-primary-hover">
                Forgot?
              </Link>
            </div>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                <Lock size={18} />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-background/50 pl-11 pr-12 py-3 text-foreground placeholder:text-muted/60 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 px-1">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary"
            />
            <label htmlFor="remember" className="text-sm text-muted cursor-pointer select-none">
              Keep me signed in
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-xl bg-primary py-3.5 font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 transition-all"
          >
            <div className="flex items-center justify-center gap-2">
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'Sign In'
              )}
            </div>
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
            <span className="bg-card px-4 text-muted/60">Professional Login</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleSocialLogin('google')}
            className="flex items-center justify-center gap-2.5 rounded-xl border border-border bg-background/50 py-3 text-sm font-bold text-foreground hover:bg-background hover:border-border/80 hover:shadow-sm active:scale-[0.98] transition-all"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin('linkedin')}
            className="flex items-center justify-center gap-2.5 rounded-xl border border-border bg-background/50 py-3 text-sm font-bold text-foreground hover:bg-background hover:border-border/80 hover:shadow-sm active:scale-[0.98] transition-all"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#0A66C2">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
      <LoginForm />
    </Suspense>
  );
}
