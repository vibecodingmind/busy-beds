import Link from 'next/link';
import { hotels } from '@/lib/api';
import HotelCard from '@/components/hotel/HotelCard';

// Avoid fetching API at build time (backend may be unreachable during Vercel build)
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let featuredHotels: { id: number; name: string; description: string | null; location: string | null; contact_phone: string | null; contact_email: string | null; images: string[]; coupon_discount_value: string; coupon_limit: number; limit_period: string }[] = [];
  try {
    const res = await hotels.list(6);
    featuredHotels = res.hotels;
  } catch {
    // API may not be running
  }

  return (
    <div>
      <section className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 px-8 py-16 text-white">
        <h1 className="text-4xl font-bold">Busy Beds</h1>
        <p className="mt-4 max-w-xl text-lg text-zinc-300">
          Subscribe to access hotel discount coupons. Generate unique coupons, show QR codes at
          check-in, and save on your stay.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-white px-6 py-3 font-medium text-zinc-900 hover:bg-zinc-100"
          >
            Get Started
          </Link>
          <Link
            href="/hotels"
            className="rounded-lg border border-zinc-500 px-6 py-3 font-medium hover:bg-zinc-800"
          >
            Browse Hotels
          </Link>
        </div>
      </section>

      {featuredHotels.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-zinc-900">Featured Hotels</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
          <div className="mt-6">
            <Link href="/hotels" className="text-emerald-600 hover:underline">
              View all hotels →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
