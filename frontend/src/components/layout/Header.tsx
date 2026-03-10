'use client';

import Link from 'next/link';
import { useContext, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { HotelAuthContext } from '@/contexts/HotelAuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const hotelAuth = useContext(HotelAuthContext);
  const hotel = hotelAuth?.hotel ?? null;
  const hotelLogout = hotelAuth?.logout;
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-zinc-900">
          Busy Beds
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/hotels" className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Browse Hotels
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-900">Dashboard</Link>
              <Link href="/my-coupons" className="text-zinc-600 hover:text-zinc-900">My Coupons</Link>
              <Link href="/subscription" className="text-zinc-600 hover:text-zinc-900">Subscription</Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="text-amber-600 hover:text-amber-700">Admin</Link>
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
                    <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg border border-zinc-200 bg-white py-2 shadow-lg">
                      <p className="px-4 py-2 text-sm text-zinc-600">{user.email}</p>
                      <button
                        onClick={() => { logout(); setShowMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                      >
                        Logout
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
          ) : null}
        </nav>
      </div>
    </header>
  );
}
