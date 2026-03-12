'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { hotels } from '@/lib/api';
import type { Hotel } from '@/lib/api';
import HotelCard from '@/components/hotel/HotelCard';
import { CardSkeleton } from '@/components/LoadingSkeleton';

export default function DealsCityPage() {
  const params = useParams();
  const city = typeof params?.city === 'string' ? decodeURIComponent(params.city).replace(/-/g, ' ') : '';
  const [list, setList] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) {
      setLoading(false);
      return;
    }
    setLoading(true);
    hotels.list({ search: city, limit: 24 }).then((r) => setList(r.hotels)).catch(() => setList([])).finally(() => setLoading(false));
  }, [city]);

  const title = city ? `Deals in ${city}` : 'Deals';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 text-muted">
          {city ? `Properties and coupon deals in ${city}` : 'Browse deals by location.'}
        </p>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : list.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {list.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-muted">
          {city ? `No properties found in ${city}.` : 'Enter a city in the URL, e.g. /deals/new-york'}
        </p>
      )}
      <Link href="/hotels" className="font-medium text-primary hover:underline">View all properties →</Link>
    </div>
  );
}
