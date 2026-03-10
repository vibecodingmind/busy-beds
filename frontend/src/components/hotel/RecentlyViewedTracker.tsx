'use client';

import { useEffect } from 'react';
import { addRecentlyViewed } from '@/hooks/useRecentlyViewedHotels';

export default function RecentlyViewedTracker({ hotelId }: { hotelId: number }) {
  useEffect(() => {
    addRecentlyViewed(hotelId);
  }, [hotelId]);
  return null;
}
