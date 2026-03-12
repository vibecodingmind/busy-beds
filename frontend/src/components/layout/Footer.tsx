'use client';

import Link from 'next/link';
import { usePublicSettings } from '@/hooks/usePublicSettings';

export default function Footer() {
  const settings = usePublicSettings();
  const siteName = settings?.site_name || 'Busy Beds';
  const supportEmail = settings?.support_email;

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-foreground">
          <span className="font-medium text-foreground">{siteName}</span>
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
