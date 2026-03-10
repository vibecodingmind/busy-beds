'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useHotelAuth } from '@/contexts/HotelAuthContext';
import { hotelAuth, promo } from '@/lib/api';
import AuthLayout from '@/components/auth/AuthLayout';

type RegisterType = 'guest' | 'hotel' | null;

function RegisterContent() {
  const [registerType, setRegisterType] = useState<RegisterType>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [hotelId, setHotelId] = useState('');
  const [hotels, setHotels] = useState<{ id: number; name: string }[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoValid, setPromoValid] = useState<{ valid: boolean; message?: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { register: hotelRegister } = useHotelAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') || undefined;

  useEffect(() => {
    if (registerType === 'hotel') {
      hotelAuth.hotelsWithoutAccount().then((r) => setHotels(r.hotels)).catch(() => {});
    }
  }, [registerType]);

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, name, refCode);
      router.push('/subscription');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const base = apiBase.replace('/api/v1', '');
    const returnTo = encodeURIComponent('/subscription');
    window.location.href = `${base}/auth/google?returnTo=${returnTo}`;
  };

  const [hotelSubmitted, setHotelSubmitted] = useState(false);

  const handleHotelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await hotelRegister(parseInt(hotelId), email, password, name);
      if (result?.pending) {
        setHotelSubmitted(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const goBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRegisterType(null);
    setError('');
  };

  if (registerType === null) {
    return (
      <AuthLayout
        title="Create Account"
        subtitle="Choose how you want to join Busy Beds"
        switchText="Already have an account?"
        switchLink="/login"
        switchLabel="Login"
        hideTopButton
      >
        <div className="space-y-4">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <button
            type="button"
            onClick={() => setRegisterType('guest')}
            className="flex w-full items-center gap-4 rounded-xl border border-zinc-600 bg-zinc-800/50 p-4 text-left transition hover:border-zinc-500 hover:bg-zinc-700/50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700">
              <svg className="h-6 w-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-white">Guest / Traveler</p>
              <p className="text-sm text-zinc-400">Subscribe to get hotel discount coupons</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setRegisterType('hotel')}
            className="flex w-full items-center gap-4 rounded-xl border border-zinc-600 bg-zinc-800/50 p-4 text-left transition hover:border-zinc-500 hover:bg-zinc-700/50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700">
              <svg className="h-6 w-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-white">Hotel Owner</p>
              <p className="text-sm text-zinc-400">Register your hotel to redeem coupons</p>
            </div>
          </button>
        </div>
      </AuthLayout>
    );
  }

  if (registerType === 'hotel') {
    if (hotelSubmitted) {
      return (
        <AuthLayout
          title="Registration Submitted"
          subtitle="Your hotel account is pending approval"
          switchText="Already have an account?"
          switchLink="/login?type=hotel"
          switchLabel="Login"
          hideTopButton
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-800/50 bg-emerald-900/30 p-4 text-emerald-300">
              <p className="font-medium">Thank you for registering!</p>
              <p className="mt-2 text-sm">
                Your registration has been submitted. An admin will review and approve your account. You will be able to log in once approved.
              </p>
            </div>
            <Link href="/login?type=hotel" className="block text-center text-zinc-400 hover:text-[#FF385C] transition-colors">
              Back to Login
            </Link>
          </div>
        </AuthLayout>
      );
    }
    return (
      <AuthLayout
        title="Register Your Hotel"
        subtitle="Create an account to redeem coupons"
        switchText="Already have an account?"
        switchLink="/login?type=hotel"
        switchLabel="Login"
        hideTopButton
      >
        <form onSubmit={handleHotelSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-900/30 border border-red-800/50 p-3 text-sm text-red-300">{error}</div>
          )}
          <div>
            <label htmlFor="hotel" className="block text-sm font-medium text-zinc-300">
              Property
            </label>
            <select
              id="hotel"
              value={hotelId}
              onChange={(e) => setHotelId(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-[#FF385C] focus:outline-none focus:ring-1 focus:ring-[#FF385C]"
            >
              <option value="">Select property</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
            {hotels.length === 0 && (
              <p className="mt-1 text-sm text-zinc-500">
                No properties available. Contact admin to add your property.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="hotel-name" className="block text-sm font-medium text-zinc-300">
              Your Name
            </label>
            <input
              id="hotel-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-[#FF385C] focus:outline-none focus:ring-1 focus:ring-[#FF385C]"
            />
          </div>
          <div>
            <label htmlFor="hotel-email" className="block text-sm font-medium text-zinc-300">
              Your Email
            </label>
            <input
              id="hotel-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-[#FF385C] focus:outline-none focus:ring-1 focus:ring-[#FF385C]"
            />
          </div>
          <div>
            <label htmlFor="hotel-password" className="block text-sm font-medium text-zinc-300">
              Password
            </label>
            <input
              id="hotel-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Enter your password"
              className="mt-1 w-full rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-[#FF385C] focus:outline-none focus:ring-1 focus:ring-[#FF385C]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-zinc-600 px-6 py-2.5 font-medium text-zinc-300 hover:bg-zinc-700/50 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || hotels.length === 0 || !hotelId}
              className="flex-1 rounded-xl bg-[#FF385C] py-3 font-medium text-white hover:bg-[#e31c5f] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Sign up as a guest to get started"
      switchText="Already have an account?"
      switchLink="/login"
      switchLabel="Login"
      hideTopButton
    >
      <form onSubmit={handleGuestSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-900/30 border border-red-800/50 p-3 text-sm text-red-300">{error}</div>
        )}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="First name"
            className="mt-1 w-full rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-[#FF385C] focus:outline-none focus:ring-1 focus:ring-[#FF385C]"
          />
        </div>
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
          <label htmlFor="promo" className="block text-sm font-medium text-zinc-300">
            Promo code (optional)
          </label>
          <input
            id="promo"
            type="text"
            value={promoCode}
            onChange={async (e) => {
              const v = e.target.value;
              setPromoCode(v);
              if (!v.trim()) {
                setPromoValid(null);
                return;
              }
              try {
                const res = await promo.validate(v);
                setPromoValid({ valid: res.valid, message: res.message });
              } catch {
                setPromoValid({ valid: false });
              }
            }}
            onBlur={async () => {
              if (!promoCode.trim()) return;
              try {
                const res = await promo.validate(promoCode);
                setPromoValid({ valid: res.valid, message: res.message });
              } catch {
                setPromoValid({ valid: false });
              }
            }}
            placeholder="e.g. WELCOME10"
            className="mt-1 w-full rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-[#FF385C] focus:outline-none focus:ring-1 focus:ring-[#FF385C]"
          />
          {promoValid?.valid && promoValid.message && (
            <p className="mt-1 text-sm text-emerald-400">✓ {promoValid.message}</p>
          )}
          {promoValid && !promoValid.valid && promoCode.trim() && (
            <p className="mt-1 text-sm text-amber-400">Invalid or expired code</p>
          )}
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
              minLength={6}
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
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#FF385C] py-3 font-medium text-white hover:bg-[#e31c5f] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-zinc-900 px-3 text-zinc-500">Or register with</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleGoogleRegister}
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
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={goBack}
            className="rounded-xl border border-zinc-600 px-6 py-2.5 font-medium text-zinc-300 hover:bg-zinc-700/50 transition-colors"
          >
            Back
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
