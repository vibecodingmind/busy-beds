'use client';

import Link from 'next/link';
import { useContext, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { HotelAuthContext } from '@/contexts/HotelAuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import { useI18n } from '@/contexts/I18nContext';
import { useTranslations } from 'next-intl';

export default function Header() {
  const { user, logout } = useAuth();
  const t = useTranslations('nav');
  const { locale, setLocale } = useI18n();
  const hotelAuth = useContext(HotelAuthContext);
  const hotel = hotelAuth?.hotel ?? null;
  const hotelLogout = hotelAuth?.logout;
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Busy Beds
        </Link>
        <nav className="flex items-center gap-4">
          <ThemeToggle />
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as 'en' | 'es' | 'fr')}
            className="rounded border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-600 dark:text-zinc-100"
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="fr">FR</option>
          </select>
          <Link href="/hotels" className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {t('browse')}
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">{t('dashboard')}</Link>
              <Link href="/my-coupons" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">{t('myCoupons')}</Link>
              <Link href="/subscription" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">{t('subscription')}</Link>
              <Link href="/referral" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">{t('referral')}</Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">{t('admin')}</Link>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 rounded-full bg-zinc-200 p-1.5 hover:bg-zinc-300"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-400 text-sm font-medium text-white">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg border border-zinc-200 bg-white py-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                      <p className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">{user.email}</p>
                      <Link
                        href="/profile"
                        onClick={() => setShowMenu(false)}
                        className="block px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        {t('account')}
                      </Link>
                      <button
                        onClick={() => { logout(); setShowMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        {t('logout')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : hotel && hotelLogout ? (
            <>
              <Link href="/hotel/dashboard" className="text-emerald-600 hover:text-emerald-700">Hotel Dashboard</Link>
              <button onClick={hotelLogout} className="rounded bg-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-300">
                Hotel Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 hover:bg-zinc-300 hover:text-zinc-900"
              title="Login / Register"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
