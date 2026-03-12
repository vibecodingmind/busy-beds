'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'busybeds-cookie-consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY);
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'accepted');
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-zinc-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          We use cookies to provide the service and for analytics. By continuing you agree to our use of cookies.{' '}
          <Link href="/privacy" className="underline hover:no-underline">
            Privacy
          </Link>
        </p>
        <button
          type="button"
          onClick={accept}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
