'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { pages } from '@/lib/api';

export default function PrivacyPage() {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pages
      .getContent('privacy')
      .then(setContent)
      .catch(() => setContent(''))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <p className="text-zinc-500">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-zinc-500 hover:underline mb-6 inline-block">
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold text-black dark:text-white">Privacy Policy</h1>
        <div
          className="mt-6 prose prose-invert max-w-none dark:prose-invert text-zinc-300 prose-p:leading-relaxed prose-headings:text-white"
          dangerouslySetInnerHTML={{
            __html: content
              ? content
              : '<p>No content has been set yet. An admin can edit this page from Admin → Pages.</p>',
          }}
        />
      </div>
    </div>
  );
}
