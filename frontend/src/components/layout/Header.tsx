'use client';

import Link from 'next/link';
import { useContext, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { HotelAuthContext } from '@/contexts/HotelAuthContext';
import { HouseIcon, UserIcon } from '@/components/icons';
import { usePublicSettings } from '@/hooks/usePublicSettings';

const menuLink = "flex items-center gap-2 px-4 py-2.5 text-sm text-black hover:bg-black/5 dark:hover:bg-zinc-700/80 dark:text-zinc-300 dark:hover:bg-zinc-700/80 transition-colors";

export default function Header() {
  const { user, logout } = useAuth();
  const hotelAuth = useContext(HotelAuthContext);
  const hotel = hotelAuth?.hotel ?? null;
  const hotelLogout = hotelAuth?.logout;
  const [showMenu, setShowMenu] = useState(false);
  const publicSettings = usePublicSettings();
  const siteName = publicSettings?.site_name || 'Busy Beds';
  const [firstWord, ...rest] = siteName.split(/\s+/);
  const displayTitle = rest.length > 0 ? (
    <><span className="text-[#FF385C]">{firstWord}</span> {rest.join(' ')}</>
  ) : (
    <span className="text-[#FF385C]">{siteName}</span>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-black/20 bg-white dark:border-zinc-800/80 dark:bg-zinc-900/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-black dark:text-zinc-100">
          <img src="/logo.png" alt="" className="h-8 w-8 flex-shrink-0 object-contain" />
          {displayTitle}
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/hotels"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-black hover:bg-black/5 dark:hover:bg-zinc-700/80 hover:text-black dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100 transition-colors"
          >
            <HouseIcon />
            Browse Properties
          </Link>
          {user ? (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FF385C] text-sm font-semibold text-white ring-2 ring-white dark:ring-zinc-900 hover:bg-[#e31c5f] transition-colors"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user.name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-black/20 bg-white py-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
                      <p className="px-4 py-2 text-xs text-black dark:text-zinc-400 truncate">{user.email}</p>
                      <div className="border-t border-black/10 dark:border-zinc-700" />
                      <Link href="/dashboard" onClick={() => setShowMenu(false)} className={menuLink}>Dashboard</Link>
                      <Link href="/favorites" onClick={() => setShowMenu(false)} className={menuLink}>Favourites</Link>
                      <Link href="/viewed" onClick={() => setShowMenu(false)} className={menuLink}>Viewed</Link>
                      <Link href="/my-coupons" onClick={() => setShowMenu(false)} className={menuLink}>My Coupons</Link>
                      <Link href="/subscription" onClick={() => setShowMenu(false)} className={menuLink}>Subscription</Link>
                      <Link href="/referral" onClick={() => setShowMenu(false)} className={menuLink}>Refer & Earn</Link>
                      {user.role === 'admin' && (
                        <Link href="/admin" onClick={() => setShowMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30">
                          Admin
                        </Link>
                      )}
                      <div className="border-t border-black/10 dark:border-zinc-700" />
                      <Link href="/profile" onClick={() => setShowMenu(false)} className={menuLink}>Account</Link>
                      <button
                        onClick={() => { logout(); setShowMenu(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm text-black hover:bg-black/5 dark:hover:bg-zinc-700/80 dark:text-zinc-300 dark:hover:bg-zinc-700"
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
              <Link href="/hotel/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-[#FF385C] hover:bg-[#fff1f2] dark:text-[#ff6b81] dark:hover:bg-white/10">Property Dashboard</Link>
              <button onClick={hotelLogout} className="rounded-lg bg-black/5 dark:bg-zinc-700 px-3 py-2 text-sm hover:bg-black/10 dark:hover:bg-zinc-600 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-200">
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-zinc-700 text-black hover:bg-black/10 dark:hover:bg-zinc-600 hover:text-black dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
              title="Login / Register"
            >
              <UserIcon />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
