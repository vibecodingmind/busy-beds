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
      {/* Hero - refined and native */}
      <section className="relative overflow-hidden mt-4 rounded-3xl border border-border bg-card px-6 sm:px-12 py-16 sm:py-24 shadow-sm">
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Beds. Deals. Done.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted leading-relaxed">
            Subscribe to access exclusive hotel discount coupons. Generate instant codes, present them at check-in, and save significantly on your stay.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/register"
              className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:-translate-y-0.5"
            >
              Get Started
            </Link>
            <Link
              href="/hotels"
              className="rounded-full border border-border bg-transparent px-8 py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-muted/10 hover:-translate-y-0.5"
            >
              Browse Properties
            </Link>
            <Link
              href="/hotels?nearme=1"
              className="rounded-full bg-muted/10 px-8 py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-muted/20 hover:-translate-y-0.5"
            >
              Hotels Near Me
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Steps - bright cards */}
      <section className="mt-20">
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
          Get Started in 3 Steps
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
          <div className="group flex flex-col items-center rounded-3xl border border-border bg-card p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="mt-6 text-lg font-semibold text-foreground">1. Create account</h3>
            <p className="mt-2 text-muted leading-relaxed">Sign up in seconds</p>
          </div>
          <div className="group flex flex-col items-center rounded-3xl border border-border bg-card p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="mt-6 text-lg font-semibold text-foreground">2. Subscribe</h3>
            <p className="mt-2 text-muted leading-relaxed">Choose a flexible plan that perfectly fits your travel frequency.</p>
          </div>
          <div className="group flex flex-col items-center rounded-3xl border border-border bg-card p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="mt-6 text-lg font-semibold text-foreground">3. Save on stays</h3>
            <p className="mt-2 text-muted leading-relaxed">Generate exclusive QR codes and show them at check-in.</p>
          </div>
        </div>
      </section>

      <RecentlyViewedSection />

      {/* Explore More Destinations - grid layout */}
      {featuredHotels.length > 0 && (
        <section className="mt-20">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Explore More Destinations
          </h2>
          <p className="mt-2 text-lg text-muted">
            Discover properties with exclusive coupon discounts
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featuredHotels.map((hotel) => (
              <div key={hotel.id} className="transition-transform hover:-translate-y-1">
                <HotelCard hotel={hotel} />
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/hotels"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:-translate-y-0.5"
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
        <section className="mt-20">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            What travelers say
          </h2>
          <p className="mt-2 text-lg text-muted">
            {totalReviews} reviews from real guests
          </p>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
            {recentReviews.map((r) => (
              <div
                key={r.id}
                className="flex flex-col justify-between rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <StarRating rating={r.rating} size="sm" />
                  </div>
                  <p className="text-base text-muted italic">"{truncate(r.comment, 120) || 'Excellent stay!'}"</p>
                </div>
                <div className="mt-6 border-t border-border pt-6">
                  <p className="font-semibold text-foreground">{r.user_name}</p>
                  <p className="text-sm text-muted">Stayed at <span className="font-medium text-foreground">{r.hotel_name}</span></p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center sm:text-left">
            <Link href="/hotels" className="inline-block text-sm font-semibold text-primary transition-colors hover:text-primary/80">
              Browse properties <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </section>
      )}

      <WaitlistForm />
    </div>
  );
}
