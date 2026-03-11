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
    try {
      try {
        await login(email, password);
        router.push(redirectTo || '/dashboard');
        return;
      } catch {
        // Guest login failed, try hotel login
      }
      await hotelLogin(email, password);
      router.push(redirectTo || '/hotel/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg === 'Failed to fetch' ? 'Cannot reach the server. If this is the live site, ensure NEXT_PUBLIC_API_URL is set to https://api.busybeds.com/api/v1 and redeploy.' : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    window.location.href = `${apiBase.replace('/api/v1', '')}/auth/google`;
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account"
      switchText="Don't have an account?"
      switchLink="/register"
      switchLabel="Register"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-900/30 border border-red-800/50 p-3 text-sm text-red-300">{error}</div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
            Your Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="mt-1 w-full rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-[#FF385C] focus:outline-none focus:ring-1 focus:ring-[#FF385C]"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
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
              className="w-full rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2.5 pr-10 text-white placeholder:text-zinc-500 focus:border-[#FF385C] focus:outline-none focus:ring-1 focus:ring-[#FF385C]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
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
              className="rounded border-zinc-600 bg-zinc-800 text-[#FF385C] focus:ring-[#FF385C]"
            />
            <span className="text-sm text-zinc-400">Remember Me</span>
          </label>
          <Link href="/forgot-password" className="text-sm text-zinc-400 hover:text-[#FF385C] transition-colors">
            Forgot Password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#FF385C] py-3 font-medium text-white hover:bg-[#e31c5f] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-zinc-900 px-3 text-zinc-500">Or continue with</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-600 bg-zinc-800/50 py-2.5 font-medium text-zinc-300 hover:bg-zinc-700/50 transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-zinc-600">Loading...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
