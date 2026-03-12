'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const HotelMapInner = dynamic(() => import('./HotelMapInner'), { ssr: false });

interface HotelMapProps {
  latitude: number;
  longitude: number;
  hotelName: string;
  location?: string | null;
}

export default function HotelMap(props: HotelMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="aspect-video w-full animate-pulse rounded-xl bg-black/10 dark:bg-zinc-700" />;
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-zinc-200">
      <HotelMapInner {...props} />
    </div>
  );
}
