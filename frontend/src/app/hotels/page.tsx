import { hotels } from '@/lib/api';
import type { Hotel } from '@/lib/api';
import HotelCard from '@/components/hotel/HotelCard';

export const dynamic = 'force-dynamic';

export default async function HotelsPage() {
  let hotelList: Hotel[] = [];
  try {
    const res = await hotels.list();
    hotelList = res.hotels;
  } catch {
    hotelList = [];
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Hotels</h1>
      <p className="mt-2 text-zinc-600">Browse hotels and generate discount coupons.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {hotelList.map((hotel) => (
          <HotelCard key={hotel.id} hotel={hotel} />
        ))}
      </div>
      {hotelList.length === 0 && (
        <p className="mt-8 text-center text-zinc-500">No hotels found.</p>
      )}
    </div>
  );
}
