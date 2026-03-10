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
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="relative hidden w-1/2 lg:block">
        <Image
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80"
          alt="Hotel"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <Link href="/" className="absolute left-8 top-8 flex items-center gap-2 hover:opacity-90">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">Busy Beds</span>
        </Link>
        <div className="absolute bottom-12 left-8 right-8">
          <h2 className="text-3xl font-bold text-white">Find your sweet stay</h2>
          <p className="mt-2 text-white/90">
            Subscribe to access property discount coupons. Generate unique coupons and save on your
            stay.
          </p>
          <div className="mt-6 flex gap-2">
            <div className="h-2 w-2 rounded-full bg-white" />
            <div className="h-2 w-2 rounded-full bg-white/40" />
            <div className="h-2 w-2 rounded-full bg-white/40" />
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full flex-col justify-center bg-[var(--background)] px-8 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/"
            className="mb-6 flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 lg:mb-8"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-semibold">Busy Beds</span>
          </Link>
          {!hideTopButton && (
            <div className="mb-8 flex justify-end">
              <Link
                href={switchLink}
                className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
              >
                {switchLabel}
              </Link>
            </div>
          )}
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
            {switchText}{' '}
            <Link href={switchLink} className="font-medium text-zinc-900 dark:text-zinc-100 underline hover:no-underline">
              {switchLabel}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
