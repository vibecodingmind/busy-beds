import Link from 'next/link';
import { hotels, reviews } from '@/lib/api';
import type { Hotel } from '@/lib/api';
import HotelCard from '@/components/hotel/HotelCard';
import WaitlistForm from '@/components/WaitlistForm';
import StarRating from '@/components/StarRating';
import RecentlyViewedSection from '@/components/RecentlyViewedSection';

// Avoid fetching API at build time (backend may be unreachable during Vercel build)
export const dynamic = 'force-dynamic';

function truncate(s: string | null | undefined, len: number): string {
  if (!s) return '';
  return s.length <= len ? s : s.slice(0, len) + '…';
}

export default async function HomePage() {
  let featuredHotels: Hotel[] = [];
  let recentReviews: { id: number; rating: number; comment: string | null; user_name: string; hotel_name: string; created_at: string }[] = [];
  let totalReviews = 0;
  try {
    const [hotelsRes, recentRes, statsRes] = await Promise.all([
      hotels.list({ limit: 8, featured: true }),
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
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero - glassy and inviting */}
      <section className="rounded-2xl border border-border bg-card px-6 sm:px-8 py-12 sm:py-16">
        <h1 className="text-4xl font-bold text-foreground md:text-5xl">
          Busy Beds
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          Subscribe to access hotel discount coupons. Generate unique coupons, show QR codes at
          check-in, and save on your stay.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-primary px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
          <Link
            href="/hotels"
            className="rounded-lg border-2 border-foreground px-6 py-3 font-medium text-foreground transition-colors hover:bg-black/5 dark:hover:bg-zinc-800"
          >
            Browse Properties
          </Link>
          <Link
            href="/hotels?nearme=1"
            className="rounded-lg bg-black/10 dark:bg-zinc-700 px-6 py-3 font-medium text-foreground transition-colors hover:bg-black/20 dark:hover:bg-zinc-600"
          >
            Hotels near me
          </Link>
        </div>
      </section>

      {/* 3 Steps - bright cards */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-semibold text-foreground">
          Get Started in 3 Steps
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
          <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary dark:bg-zinc-800">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="mt-4 font-medium text-foreground">1. Create account</h3>
            <p className="mt-1 text-sm text-muted">Sign up in seconds</p>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary dark:bg-zinc-800">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="mt-4 font-medium text-foreground">2. Subscribe</h3>
            <p className="mt-1 text-sm text-muted">Choose a plan that fits</p>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary dark:bg-zinc-800">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="mt-4 font-medium text-foreground">3. Save on stays</h3>
            <p className="mt-1 text-sm text-muted">Generate & use coupons</p>
          </div>
        </div>
      </section>

      <RecentlyViewedSection />

      {/* Explore More Destinations - grid layout */}
      {featuredHotels.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-foreground">
            Explore More Destinations
          </h2>
          <p className="mt-1 text-muted">
            Discover properties with exclusive coupon discounts
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featuredHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/hotels"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
            >
              View all properties
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      {totalReviews > 0 && recentReviews.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-foreground">
            What travelers say
          </h2>
          <p className="mt-1 text-muted">
            {totalReviews} reviews from real guests
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            {recentReviews.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <p className="font-medium text-foreground">{r.hotel_name}</p>
                <div className="mt-2">
                  <StarRating rating={r.rating} size="md" />
                </div>
                <p className="mt-2 text-sm text-muted">
                  {truncate(r.comment, 80) || '—'}
                </p>
                <p className="mt-2 text-xs text-muted">— {r.user_name}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link href="/hotels" className="font-medium text-primary hover:underline">
              Browse properties →
            </Link>
          </div>
        </section>
      )}

      <WaitlistForm />
    </div>
  );
}
