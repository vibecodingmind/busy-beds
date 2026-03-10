'use client';

import Link from 'next/link';
import Image from 'next/image';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  switchText: string;
  switchLink: string;
  switchLabel: string;
  hideTopButton?: boolean;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  switchText,
  switchLink,
  switchLabel,
  hideTopButton = false,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      {/* Glassy dark container */}
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-900/95 shadow-2xl backdrop-blur-xl">
        <div className="flex min-h-[600px] flex-col lg:flex-row">
          {/* Left panel - image */}
          <div className="relative hidden w-full lg:block lg:w-1/2">
            <Image
              src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80"
              alt="Travel"
              fill
              className="object-cover"
              priority
              sizes="50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <Link
              href="/"
              className="absolute right-6 top-6 rounded-lg border border-white/20 bg-black/30 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              Back to website →
            </Link>
            <div className="absolute left-8 bottom-12 right-8">
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                Find your sweet stay
              </h2>
              <p className="mt-2 text-white/90">
                Subscribe to access property discount coupons. Generate unique coupons and save on your stay.
              </p>
              <div className="mt-6 flex gap-2">
                <div className="h-1.5 w-8 rounded-full bg-white" />
                <div className="h-1.5 w-6 rounded-full bg-white/40" />
                <div className="h-1.5 w-6 rounded-full bg-white/40" />
              </div>
            </div>
          </div>

          {/* Right panel - form */}
          <div className="flex flex-1 flex-col justify-center bg-zinc-900/98 px-8 py-12 lg:px-12 lg:py-16">
            <div className="mx-auto w-full max-w-sm">
              <Link
                href="/"
                className="mb-6 inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors lg:mb-8"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-semibold">Busy Beds</span>
              </Link>
              {!hideTopButton && (
                <div className="mb-6 flex justify-end lg:mb-8">
                  <Link
                    href={switchLink}
                    className="rounded-lg border border-zinc-600 bg-zinc-800/80 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-zinc-700"
                  >
                    {switchLabel}
                  </Link>
                </div>
              )}
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              <p className="mt-1 text-zinc-400">{subtitle}</p>
              <div className="mt-8">{children}</div>
              <p className="mt-8 text-center text-sm text-zinc-400">
                {switchText}{' '}
                <Link href={switchLink} className="font-medium text-[#FF385C] hover:text-[#ff6b81] transition-colors">
                  {switchLabel}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
