'use client';

import { useState } from 'react';
import { ShareIcon } from '@/components/icons';

interface ShareButtonProps {
  hotelName: string;
  hotelId: number;
  className?: string;
}

export default function ShareButton({ hotelName, hotelId, className = '' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined' ? `${window.location.origin}/hotels/${hotelId}` : '';

  const handleShare = async () => {
    const shareData = {
      title: hotelName,
      url,
      text: `Check out ${hotelName} on Busy Beds`,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    if (typeof navigator === 'undefined') return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:border-zinc-500 ${className}`}
      aria-label="Share this property"
    >
      <ShareIcon />
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}
