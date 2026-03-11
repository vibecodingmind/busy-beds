'use client';

import Link from 'next/link';
import { usePublicSettings } from '@/hooks/usePublicSettings';

export default function Footer() {
  const settings = usePublicSettings();
  const siteName = settings?.site_name || 'Busy Beds';
  const termsUrl = settings?.terms_url;
  const privacyUrl = settings?.privacy_url;
  const supportEmail = settings?.support_email;
  const hasLinks = termsUrl || privacyUrl || supportEmail;

  if (!hasLinks) return null;

  return (
    <footer className="mt-auto border-t border-black/10 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-black dark:text-zinc-400">
          <span className="font-medium text-black dark:text-zinc-300">{siteName}</span>
          {termsUrl && (
            <a href={termsUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              Terms of service
            </a>
          )}
          {privacyUrl && (
            <a href={privacyUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              Privacy policy
            </a>
          )}
          {supportEmail && (
            <a href={`mailto:${supportEmail}`} className="hover:underline">
              Contact
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
