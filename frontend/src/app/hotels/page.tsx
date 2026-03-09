import { hotels } from '@/lib/api';
import HotelCard from '@/components/hotel/HotelCard';

export default async function HotelsPage() {
  let hotelList: { id: number; name: string; description: string | null; location: string | null; contact_phone: string | null; contact_email: string | null; images: string[]; coupon_discount_value: string; coupon_limit: number; limit_period: string }[] = [];
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
