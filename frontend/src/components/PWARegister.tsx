'use client';

import { useEffect, useState } from 'react';

export default function PWARegister() {
  const [canInstall, setCanInstall] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const h = (e: Event) => {
      (e as { prompt?: () => void }).prompt && setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);
  return null;
}
