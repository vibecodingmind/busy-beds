import Link from 'next/link';
import { hotels, reviews } from '@/lib/api';
import type { Hotel } from '@/lib/api';
import HotelCard from '@/components/hotel/HotelCard';

// Avoid fetching API at build time (backend may be unreachable during Vercel build)
export const dynamic = 'force-dynamic';

function truncate(s: string | null | undefined, len: number): string {
  if (!s) return '';
  return s.length <= len ? s : s.slice(0, len) + '…';
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex text-amber-500" aria-label={`${rating} stars`}>
      {'★'.repeat(Math.round(rating))}
      <span className="text-zinc-300">{'★'.repeat(5 - Math.round(rating))}</span>
    </span>
  );
}

export default async function HomePage() {
  let featuredHotels: Hotel[] = [];
  let recentReviews: { id: number; rating: number; comment: string | null; user_name: string; hotel_name: string; created_at: string }[] = [];
  let totalReviews = 0;
  try {
    const [hotelsRes, recentRes, statsRes] = await Promise.all([
      hotels.list({ limit: 6 }),
      reviews.recent(3).catch(() => ({ reviews: [] })),
      reviews.stats().catch(() => ({ totalReviews: 0 })),
    ]);
    featuredHotels = hotelsRes.hotels;
    recentReviews = recentRes.reviews;
    totalReviews = statsRes.totalReviews;
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

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-zinc-900">Get Started in 3 Steps</h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="mt-3 font-medium text-zinc-900">1. Create account</h3>
            <p className="mt-1 text-sm text-zinc-600">Sign up in seconds</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="mt-3 font-medium text-zinc-900">2. Choose a plan</h3>
            <p className="mt-1 text-sm text-zinc-600">Pick a subscription</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0-4h2m-2 4h-6m-2-6H5a2 2 0 00-2 2v6a2 2 0 002 2h2m-6-2h6m-6-2V9a2 2 0 012-2h2m0 0V5" />
              </svg>
            </div>
            <h3 className="mt-3 font-medium text-zinc-900">3. Get coupons</h3>
            <p className="mt-1 text-sm text-zinc-600">Show QR at check-in</p>
          </div>
        </div>
      </section>

      {totalReviews > 0 && recentReviews.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-zinc-900">What travelers say</h2>
          <p className="mt-1 text-zinc-600">{totalReviews} reviews from real guests</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {recentReviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="font-medium text-zinc-900">{r.hotel_name}</p>
                <div className="mt-2">
                  <StarRating rating={r.rating} />
                </div>
                <p className="mt-2 text-sm text-zinc-600">{truncate(r.comment, 80) || '—'}</p>
                <p className="mt-2 text-xs text-zinc-500">— {r.user_name}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link href="/hotels" className="text-emerald-600 hover:underline">
              Browse hotels →
            </Link>
          </div>
        </section>
      )}

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
