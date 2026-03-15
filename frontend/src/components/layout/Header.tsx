'use client';

import Link from 'next/link';
import { useContext, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { HotelAuthContext } from '@/contexts/HotelAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { HouseIcon, UserIcon, SunIcon, MoonIcon } from '@/components/icons';

const menuLink = "flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-black/5 dark:hover:bg-zinc-700/80 transition-colors";

function IconProfile({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function IconAdmin({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function IconLogout({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const hotelAuth = useContext(HotelAuthContext);
  const hotel = hotelAuth?.hotel ?? null;
  const hotelLogout = hotelAuth?.logout;
  const [showMenu, setShowMenu] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 dark:bg-zinc-900/95 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center shrink-0" aria-label="Busy Beds home">
          <img
            src="/logo.png"
            alt="Busy Beds"
            className="h-9 w-auto max-h-10 object-contain object-left"
          />
        </Link>
        <nav className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
          <Link
            href="/hotels"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-black/5 dark:hover:bg-zinc-700/80 dark:hover:bg-white/10 transition-colors"
          >
            <HouseIcon />
            Properties
          </Link>
          {user ? (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-white ring-2 ring-background hover:opacity-90 transition-opacity"
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
                    <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-border bg-card shadow-xl py-1">
                      <p className="px-4 py-2 text-xs text-muted truncate">{user.email}</p>
                      <div className="border-t border-border" />
                      <Link href="/settings/profile" onClick={() => setShowMenu(false)} className={menuLink}>
                        <IconProfile className="w-4 h-4 opacity-70" />
                        Account Settings
                      </Link>
                      {user.role === 'admin' && (
                        <Link href="/admin" onClick={() => setShowMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30 transition-colors">
                          <IconAdmin className="w-4 h-4 opacity-70" />
                          Admin Console
                        </Link>
                      )}
                      <div className="border-t border-border" />
                      <button
                        onClick={() => { logout(); setShowMenu(false); }}
                        className={`w-full px-4 py-2.5 text-left text-sm ${menuLink}`}
                      >
                        <IconLogout className="w-4 h-4 opacity-70" />
                        Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : hotel && hotelLogout ? (
            <>
              <Link href="/hotel/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary-light">Property Dashboard</Link>
              <button onClick={hotelLogout} className="rounded-lg bg-black/5 dark:bg-zinc-700 px-3 py-2 text-sm hover:bg-black/10 dark:hover:bg-zinc-600 text-foreground dark:text-zinc-200">
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-zinc-700 text-foreground hover:bg-black/10 dark:hover:bg-zinc-600 dark:hover:text-zinc-300"
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
