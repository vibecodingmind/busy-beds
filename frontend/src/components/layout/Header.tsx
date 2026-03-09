'use client';

import Link from 'next/link';
import { useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { HotelAuthContext } from '@/contexts/HotelAuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const hotelAuth = useContext(HotelAuthContext);
  const hotel = hotelAuth?.hotel ?? null;
  const hotelLogout = hotelAuth?.logout;

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-zinc-900">
          Busy Beds
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/hotels" className="text-zinc-600 hover:text-zinc-900">
            Hotels
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-900">
                Dashboard
              </Link>
              <Link href="/my-coupons" className="text-zinc-600 hover:text-zinc-900">
                My Coupons
              </Link>
              <Link href="/subscription" className="text-zinc-600 hover:text-zinc-900">
                Subscription
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="text-amber-600 hover:text-amber-700">
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="rounded bg-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-zinc-600 hover:text-zinc-900">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Sign Up
              </Link>
            </>
          )}
          {hotel && hotelLogout && (
            <>
              <Link href="/hotel/dashboard" className="text-emerald-600 hover:text-emerald-700">
                Hotel Dashboard
              </Link>
              <button
                onClick={hotelLogout}
                className="rounded bg-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-300"
              >
                Hotel Logout
              </button>
            </>
          )}
          {!user && !hotel && (
            <Link href="/hotel/login" className="text-zinc-500 hover:text-zinc-700">
              Hotel Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
