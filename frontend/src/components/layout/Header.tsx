'use client';

import Link from 'next/link';
import { useContext, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { HotelAuthContext } from '@/contexts/HotelAuthContext';
import ThemeToggle from '@/components/ThemeToggle';

const menuLink = "flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700/80 transition-colors";

export default function Header() {
  const { user, logout } = useAuth();
  const hotelAuth = useContext(HotelAuthContext);
  const hotel = hotelAuth?.hotel ?? null;
  const hotelLogout = hotelAuth?.logout;
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Busy Beds
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/hotels"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Browse Hotels
          </Link>
          <ThemeToggle />
          {user ? (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white ring-2 ring-white dark:ring-zinc-900 hover:bg-emerald-700 transition-colors"
                >
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
                      <p className="px-4 py-2 text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                      <div className="border-t border-zinc-100 dark:border-zinc-700" />
                      <Link href="/dashboard" onClick={() => setShowMenu(false)} className={menuLink}>Dashboard</Link>
                      <Link href="/favorites" onClick={() => setShowMenu(false)} className={menuLink}>Favourites</Link>
                      <Link href="/my-coupons" onClick={() => setShowMenu(false)} className={menuLink}>My Coupons</Link>
                      <Link href="/subscription" onClick={() => setShowMenu(false)} className={menuLink}>Subscription</Link>
                      <Link href="/referral" onClick={() => setShowMenu(false)} className={menuLink}>Refer & Earn</Link>
                      {user.role === 'admin' && (
                        <Link href="/admin" onClick={() => setShowMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30">
                          Admin
                        </Link>
                      )}
                      <div className="border-t border-zinc-100 dark:border-zinc-700" />
                      <Link href="/profile" onClick={() => setShowMenu(false)} className={menuLink}>Account</Link>
                      <button
                        onClick={() => { logout(); setShowMenu(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : hotel && hotelLogout ? (
            <>
              <Link href="/hotel/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30">Hotel Dashboard</Link>
              <button onClick={hotelLogout} className="rounded-lg bg-zinc-200 px-3 py-2 text-sm hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-200">
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 hover:bg-zinc-300 hover:text-zinc-900 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
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
