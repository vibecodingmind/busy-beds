'use client';

import Link from 'next/link';
import { useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { HotelAuthContext } from '@/contexts/HotelAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { HouseIcon, UserIcon, SunIcon, MoonIcon } from '@/components/icons';

const menuLink = "flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-black/5 dark:hover:bg-zinc-800/50 transition-all duration-200 rounded-lg mx-1";

function IconProfile({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function IconAdmin({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function IconLogout({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const hotelAuth = useContext(HotelAuthContext);
  const hotel = hotelAuth?.hotel ?? null;
  const hotelLogout = hotelAuth?.logout;
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Explore', href: '/hotels', icon: <HouseIcon /> },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 border-b ${scrolled
          ? 'bg-background/80 dark:bg-zinc-900/80 backdrop-blur-xl border-border py-2'
          : 'bg-background border-transparent py-4'
        } print:hidden`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="flex items-center shrink-0 group" aria-label="Busy Beds home">
          <img
            src="/logo.png"
            alt="Busy Beds"
            className="h-10 w-auto transition-transform group-hover:scale-105"
          />
        </Link>

        <nav className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-1 bg-muted/30 rounded-full p-1 border border-border/50">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted hover:text-foreground'
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-muted transition-colors border border-transparent hover:border-border"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 p-1 pl-3 rounded-full bg-muted/40 border border-border hover:bg-muted transition-all active:scale-95 group"
              >
                <div className="hidden sm:flex flex-col items-end mr-1">
                  <span className="text-xs font-bold text-foreground truncate max-w-[100px]">{user.name}</span>
                  <span className="text-[10px] text-muted capitalize leading-tight">{user.role}</span>
                </div>
                <div className="h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-bold text-white ring-2 ring-background border border-border shadow-sm group-hover:ring-primary/20 transition-all">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user.name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full z-20 mt-3 w-64 rounded-2xl border border-border bg-card shadow-2xl py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-5 py-3 bg-muted/30 mb-1">
                      <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Signed in as</p>
                      <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted truncate">{user.email}</p>
                    </div>

                    <Link href="/settings/overview" onClick={() => setShowMenu(false)} className={menuLink}>
                      <IconProfile className="text-primary" />
                      Dashboard Overview
                    </Link>

                    <Link href="/settings/profile" onClick={() => setShowMenu(false)} className={menuLink}>
                      <IconProfile className="opacity-70" />
                      Account Settings
                    </Link>

                    {user.role === 'admin' && (
                      <div className="pt-2 mt-1 border-t border-border">
                        <Link href="/admin" onClick={() => setShowMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all rounded-lg mx-1">
                          <IconAdmin />
                          Admin Console
                        </Link>
                      </div>
                    )}

                    <div className="pt-2 mt-1 border-t border-border">
                      <button
                        onClick={() => { logout(); setShowMenu(false); }}
                        className="w-[calc(100%-8px)] mx-1 flex items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all rounded-lg"
                      >
                        <IconLogout />
                        Log out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : hotel && hotelLogout ? (
            <div className="flex items-center gap-3">
              <Link
                href="/hotel/dashboard"
                className="hidden sm:inline-flex rounded-lg bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20 transition-colors"
              >
                Property Dashboard
              </Link>
              <button
                onClick={hotelLogout}
                className="flex items-center gap-2 rounded-lg bg-muted border border-border px-4 py-2 text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                <IconLogout className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-white hover:opacity-90 shadow-md shadow-primary/20 active:scale-95 transition-all"
            >
              Sign In
              <UserIcon className="h-4 w-4" />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
