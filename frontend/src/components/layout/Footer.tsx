'use client';

import Link from 'next/link';
import { usePublicSettings } from '@/hooks/usePublicSettings';

export default function Footer() {
  const settings = usePublicSettings();
  const siteName = settings?.site_name || 'Busy Beds';
  const supportEmail = settings?.support_email;

  return (
    <footer className="mt-auto border-t border-black/10 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-black dark:text-zinc-400">
          <span className="font-medium text-black dark:text-zinc-300">{siteName}</span>
          <Link href="/about" className="hover:underline">
            About
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
          <Link href="/status" className="hover:underline">
            Status
          </Link>
          {supportEmail && (
            <a href={`mailto:${supportEmail}`} className="hover:underline">
              {supportEmail}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
