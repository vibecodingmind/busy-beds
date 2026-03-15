'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useHotelAuth } from '@/contexts/HotelAuthContext';
import { hotelAuth, promo } from '@/lib/api';
import AuthLayout from '@/components/auth/AuthLayout';
import SearchableSelect from '@/components/SearchableSelect';
import {
  User,
  Building2,
  ArrowLeft,
  Mail,
  Lock,
  User as UserIcon,
  Ticket,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Globe
} from 'lucide-react';

type RegisterType = 'guest' | 'hotel' | null;

function RegisterContent() {
  const [registerType, setRegisterType] = useState<RegisterType>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [hotelId, setHotelId] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('Tanzania');
  const [hotels, setHotels] = useState<{ id: number; name: string; country?: string }[]>([]);
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
      hotelAuth.hotelsWithoutAccount().then((r) => setHotels(r.hotels)).catch(() => { });
    }
  }, [registerType]);

  const uniqueCountries = useMemo(() => {
    const countries = Array.from(new Set(hotels.map(h => h.country).filter(Boolean)));
    return countries.sort() as string[];
  }, [hotels]);

  const filteredHotels = useMemo(() => {
    if (!selectedCountry) return [];
    return hotels.filter(h => h.country === selectedCountry);
  }, [hotels, selectedCountry]);

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

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const oauthBase = apiBase.replace('/api/v1', '');

  const handleSocialRegister = (provider: 'google' | 'linkedin') => {
    window.location.href = `${oauthBase}/auth/${provider}?returnTo=${encodeURIComponent('/subscription')}`;
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
        title="Join Busy Beds"
        subtitle="Select your account type to get started"
        switchText="Already have an account?"
        switchLink="/login"
        switchLabel="Login"
        hideTopButton
      >
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <button
            type="button"
            onClick={() => setRegisterType('guest')}
            className="group flex w-full items-center gap-5 rounded-2xl border border-border bg-background/50 p-5 text-left transition-all hover:border-primary/50 hover:bg-background hover:shadow-xl hover:shadow-primary/5 active:scale-[0.99]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <UserIcon size={28} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-foreground tracking-tight">Guest / Traveler</p>
              <p className="text-sm text-muted/80">Subscribe to unlock massive hotel discounts</p>
            </div>
            <div className="text-muted/30 group-hover:text-primary transition-colors pr-2">
              <ChevronRight size={20} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setRegisterType('hotel')}
            className="group flex w-full items-center gap-5 rounded-2xl border border-border bg-background/50 p-5 text-left transition-all hover:border-primary/50 hover:bg-background hover:shadow-xl hover:shadow-primary/5 active:scale-[0.99]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Building2 size={28} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-foreground tracking-tight">Hotel Owner</p>
              <p className="text-sm text-muted/80">Register your property to start redeeming coupons</p>
            </div>
            <div className="text-muted/30 group-hover:text-indigo-600 transition-colors pr-2">
              <ChevronRight size={20} />
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
          title="Review Pending"
          subtitle="We've received your registration"
          switchText="Need help?"
          switchLink="/contact"
          switchLabel="Support"
          hideTopButton
        >
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
            <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="font-bold text-emerald-800 dark:text-emerald-400 text-lg">Submission Successful</h3>
              <p className="mt-2 text-sm text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">
                An administrator will review your hotel details. You will receive an email once your account is activated.
              </p>
            </div>
            <Link href="/login" className="block w-full text-center py-3 rounded-xl border border-border font-bold hover:bg-background transition-colors">
              Back to Login
            </Link>
          </div>
        </AuthLayout>
      );
    }
    return (
      <AuthLayout
        title="Hotel Account"
        subtitle="Set up your property manager account"
        switchText="Wait, I'm a guest"
        switchLink="#"
        switchLabel="Back"
        hideTopButton
      >
        <form onSubmit={handleHotelSubmit} className="space-y-4">
          <button type="button" onClick={goBack} className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-foreground transition-colors mb-2">
            <ArrowLeft size={14} /> Change Account Type
          </button>

          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 p-4 text-sm text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-2 flex gap-3">
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="country" className="text-sm font-semibold text-foreground/80 px-1">
              Country
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted z-10">
                <Globe size={18} />
              </div>
              <SearchableSelect
                value="Tanzania"
                options={['Tanzania']}
                onChange={() => { }} // Read-only for now
                placeholder="Tanzania"
                disabled
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="hotel" className="text-sm font-semibold text-foreground/80 px-1">
              Select Property
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted z-10">
                <Building2 size={18} />
              </div>
              <SearchableSelect
                value={filteredHotels.find(h => h.id.toString() === hotelId) || null}
                options={filteredHotels}
                onChange={(h) => setHotelId(h?.id.toString() || '')}
                placeholder={selectedCountry ? "Choose your property..." : "Select country first"}
                searchPlaceholder="Search properties..."
                optionLabel={(h) => h ? h.name : ''}
                disabled={!selectedCountry || filteredHotels.length === 0}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="hotel-name" className="text-sm font-semibold text-foreground/80 px-1">
              Full Name
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-600 transition-colors">
                <UserIcon size={18} />
              </div>
              <input
                id="hotel-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Manager Name"
                className="w-full rounded-xl border border-border bg-background/50 pl-11 pr-4 py-3 text-foreground placeholder:text-muted/60 focus:bg-background focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="hotel-email" className="text-sm font-semibold text-foreground/80 px-1">
              Manager Email
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-600 transition-colors">
                <Mail size={18} />
              </div>
              <input
                id="hotel-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="manager@hotel.com"
                className="w-full rounded-xl border border-border bg-background/50 pl-11 pr-4 py-3 text-foreground placeholder:text-muted/60 focus:bg-background focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="hotel-password" className="text-sm font-semibold text-foreground/80 px-1">
              Secure Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-600 transition-colors">
                <Lock size={18} />
              </div>
              <input
                id="hotel-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-background/50 pl-11 pr-4 py-3 text-foreground placeholder:text-muted/60 focus:bg-background focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || hotels.length === 0 || !hotelId}
            className="w-full rounded-xl bg-indigo-600 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 transition-all mt-4"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Submit Manager Application'}
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join Busy Beds as a guest"
      switchText="Wait, I'm an owner"
      switchLink="#"
      switchLabel="Back"
      hideTopButton
    >
      <form onSubmit={handleGuestSubmit} className="space-y-4">
        <button type="button" onClick={goBack} className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-foreground transition-colors mb-2">
          <ArrowLeft size={14} /> Change Account Type
        </button>

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 p-4 text-sm text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-2 flex gap-3">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-semibold text-foreground/80 px-1">
              Full Name
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                <UserIcon size={18} />
              </div>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="First Last"
                className="w-full rounded-xl border border-border bg-background/50 pl-11 pr-4 py-3 text-foreground placeholder:text-muted/60 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="promo" className="text-sm font-semibold text-foreground/80 px-1">
              Promo Code
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                <Ticket size={18} />
              </div>
              <input
                id="promo"
                type="text"
                value={promoCode}
                onChange={async (e) => {
                  const v = e.target.value.toUpperCase();
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
                placeholder="Optional"
                className="w-full rounded-xl border border-border bg-background/50 pl-11 pr-4 py-3 text-foreground placeholder:text-muted/60 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
              />
              {promoValid?.valid && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                  <CheckCircle2 size={18} />
                </div>
              )}
            </div>
            {promoValid && !promoValid.valid && promoCode.trim() && (
              <p className="px-1 text-[10px] font-bold text-amber-500 uppercase tracking-wider">Invalid Code</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-semibold text-foreground/80 px-1">
            Email Address
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
              placeholder="you@example.com"
              className="w-full rounded-xl border border-border bg-background/50 pl-11 pr-4 py-3 text-foreground placeholder:text-muted/60 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-semibold text-foreground/80 px-1">
            Create Password
          </label>
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
              minLength={6}
              placeholder="Min. 6 characters"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3.5 font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 transition-all mt-2"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Create Account'}
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
            <span className="bg-card px-4 text-muted/60">Social Registration</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleSocialRegister('google')}
            className="flex items-center justify-center gap-2.5 rounded-xl border border-border bg-background/50 py-3 text-sm font-bold text-foreground hover:bg-background hover:border-border/80 hover:shadow-sm transition-all"
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
            onClick={() => handleSocialRegister('linkedin')}
            className="flex items-center justify-center gap-2.5 rounded-xl border border-border bg-background/50 py-3 text-sm font-bold text-foreground hover:bg-background hover:border-border/80 hover:shadow-sm transition-all"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#0A66C2">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
      <RegisterContent />
    </Suspense>
  );
}
