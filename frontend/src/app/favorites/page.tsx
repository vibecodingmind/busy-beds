'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { favorites } from '@/lib/api';
import type { Hotel } from '@/lib/api';
import HotelCard from '@/components/hotel/HotelCard';

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    favorites
      .hotels()
      .then((r) => setHotels(r.hotels))
      .catch(() => setHotels([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) return <div className="py-12 text-muted">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Favourites</h1>
        <p className="mt-1 text-muted">
          Properties you&apos;ve saved for later. Remove by clicking the heart on any property card.
        </p>
      </div>

      {loading ? (
        <p className="text-muted">Loading favourites...</p>
      ) : hotels.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted">No favourites yet.</p>
          <Link href="/hotels" className="mt-4 inline-block font-medium text-[#FF385C] hover:underline">
            Browse properties →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
          {hotels.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              onRemoveFavorite={() => setHotels((prev) => prev.filter((h) => h.id !== hotel.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
