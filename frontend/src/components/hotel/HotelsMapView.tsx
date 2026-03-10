'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Hotel } from '@/lib/api';

const HotelsMapInner = dynamic(() => import('./HotelsMapInner'), { ssr: false });

interface HotelsMapViewProps {
  hotels: Hotel[];
}

export default function HotelsMapView({ hotels }: HotelsMapViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const withCoords = hotels.filter(
    (h): h is Hotel & { latitude: number; longitude: number } => h.latitude != null && h.longitude != null
  );

  if (!mounted) {
    return <div className="h-[500px] w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />;
  }

  if (withCoords.length === 0) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50">
        <p className="text-zinc-900 dark:text-zinc-400">No hotels with location data to show on map.</p>
        <p className="mt-2 text-sm text-zinc-900 dark:text-zinc-400">Browse the list view instead.</p>
      </div>
    );
  }

  return (
    <div className="h-[500px] w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
      <HotelsMapInner hotels={withCoords} />
    </div>
  );
}
