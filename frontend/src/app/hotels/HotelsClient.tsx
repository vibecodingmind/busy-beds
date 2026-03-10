'use client';

import { useState, useEffect } from 'react';
import { hotels } from '@/lib/api';
import type { Hotel } from '@/lib/api';
import HotelCard from '@/components/hotel/HotelCard';
import { CardSkeleton } from '@/components/LoadingSkeleton';

export default function HotelsClient() {
  const [hotelList, setHotelList] = useState<Hotel[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string>('name');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    hotels
      .list({ search: search || undefined, sort: sort || undefined })
      .then((r) => {
        setHotelList(r.hotels);
      })
      .catch(() => setHotelList([]))
      .finally(() => setLoading(false));
  }, [search, sort]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Hotels</h1>
      <p className="mt-2 text-zinc-600">Browse hotels and generate discount coupons.</p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search by name, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-zinc-300 px-4 py-2"
        >
          <option value="name">Sort by Name</option>
          <option value="location">Sort by Location</option>
        </select>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {hotelList.some((h) => h.featured) && (
            <div className="mt-8">
              <h2 className="mb-4 text-lg font-semibold text-zinc-800">Featured Hotels</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {hotelList.filter((h) => h.featured).map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            </div>
          )}
          <div className={hotelList.some((h) => h.featured) ? 'mt-10' : 'mt-8'}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-800">
              {hotelList.some((h) => h.featured) ? 'All Hotels' : 'Hotels'}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {hotelList.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          </div>
        </>
      )}
      {!loading && hotelList.length === 0 && (
        <p className="mt-8 text-center text-zinc-500">No hotels found.</p>
      )}
    </div>
  );
}
