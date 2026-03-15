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
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32 sm:pt-32 sm:pb-40">
        {/* Background Decorative Elements */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-emerald-400 to-cyan-500 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-7xl">
              Travel better with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-600 dark:from-emerald-400 dark:to-cyan-500">BusyBeds</span>
            </h1>
            <p className="mt-8 text-lg leading-8 text-zinc-600 dark:text-zinc-300">
              Unlock exclusive hotel discount coupons. Generate instant QR codes, show them at check-in, and save significantly on your next luxurious getaway.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link
                href="/register"
                className="w-full sm:w-auto rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                Get Started
              </Link>
              <Link
                href="/hotels?nearme=1"
                className="w-full sm:w-auto rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 px-8 py-3.5 text-sm font-semibold text-zinc-900 dark:text-white shadow-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:shadow-md hover:-translate-y-0.5"
              >
                Find Hotels Near Me
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics or Trust Bar */}
      <section className="border-y border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-12 text-center sm:grid-cols-3">
            <div className="mx-auto flex max-w-xs flex-col gap-y-3">
              <dt className="text-base leading-7 text-zinc-600 dark:text-zinc-400">Exclusive Properties</dt>
              <dd className="order-first text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">100+</dd>
            </div>
            <div className="mx-auto flex max-w-xs flex-col gap-y-3">
              <dt className="text-base leading-7 text-zinc-600 dark:text-zinc-400">Active Coupons</dt>
              <dd className="order-first text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">10k+</dd>
            </div>
            <div className="mx-auto flex max-w-xs flex-col gap-y-3">
              <dt className="text-base leading-7 text-zinc-600 dark:text-zinc-400">Happy Travelers</dt>
              <dd className="order-first text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">50k+</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* 3 Steps - Modern Cards */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-emerald-600 dark:text-emerald-400">Simple Process</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">Get Started in 3 Steps</p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">

              <div className="flex flex-col items-start bg-white dark:bg-zinc-900/80 p-8 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800/60 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group">
                <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 p-4 ring-1 ring-emerald-200 dark:ring-emerald-800/60 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                  <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <dt className="mt-6 font-semibold text-zinc-900 dark:text-white text-xl">1. Create Account</dt>
                <dd className="mt-2 leading-7 text-zinc-600 dark:text-zinc-400">Sign up in seconds and gain instant access to our curated platform.</dd>
              </div>

              <div className="flex flex-col items-start bg-white dark:bg-zinc-900/80 p-8 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800/60 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group">
                <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 p-4 ring-1 ring-emerald-200 dark:ring-emerald-800/60 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                  <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                </div>
                <dt className="mt-6 font-semibold text-zinc-900 dark:text-white text-xl">2. Subscribe</dt>
                <dd className="mt-2 leading-7 text-zinc-600 dark:text-zinc-400">Choose a flexible subscription plan that perfectly fits your travel frequency and needs.</dd>
              </div>

              <div className="flex flex-col items-start bg-white dark:bg-zinc-900/80 p-8 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800/60 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group">
                <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 p-4 ring-1 ring-emerald-200 dark:ring-emerald-800/60 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                  <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>
                <dt className="mt-6 font-semibold text-zinc-900 dark:text-white text-xl">3. Generate & Save</dt>
                <dd className="mt-2 leading-7 text-zinc-600 dark:text-zinc-400">Generate exclusive QR codes and show them at check-in for massive instant savings.</dd>
              </div>

            </dl>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      {featuredHotels.length > 0 && (
        <section className="bg-zinc-100/60 dark:bg-zinc-900/40 py-24 sm:py-32 border-y border-zinc-200/50 dark:border-zinc-800/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">Premium Destinations</h2>
              <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">Discover elite properties with massive subscriber discounts.</p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {featuredHotels.map((hotel) => (
                <div key={hotel.id} className="group relative transition-transform duration-300 hover:-translate-y-1">
                  <HotelCard hotel={hotel} />
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <Link
                href="/hotels"
                className="inline-flex items-center gap-x-2 rounded-full bg-zinc-900 dark:bg-white px-8 py-3.5 text-sm font-semibold text-white dark:text-zinc-900 shadow-sm transition-all hover:bg-zinc-700 dark:hover:bg-zinc-200 hover:shadow-md hover:-translate-y-0.5"
              >
                View All Properties
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      {totalReviews > 0 && recentReviews.length > 0 && (
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="text-lg font-semibold leading-8 tracking-tight text-emerald-600 dark:text-emerald-400">Testimonials</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">Loved by travelers</p>
            </div>
            <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {recentReviews.map((r) => (
                  <div key={r.id} className="flex flex-col justify-between rounded-3xl bg-white dark:bg-zinc-900/80 p-8 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/60 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <StarRating rating={r.rating} size="sm" />
                      </div>
                      <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300 italic">"{truncate(r.comment, 150) || 'Excellent stay!'}"</p>
                    </div>
                    <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800/60 pt-6">
                      <p className="font-semibold text-zinc-900 dark:text-white">{r.user_name}</p>
                      <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">Stayed at <span className="font-medium text-zinc-700 dark:text-zinc-300">{r.hotel_name}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="bg-zinc-50 dark:bg-zinc-950 pb-16">
        <RecentlyViewedSection />
      </div>

      {/* Waitlist (Newsletter) */}
      <div className="pb-24 sm:pb-32">
        <WaitlistForm />
      </div>

    </div>
  );
}
