'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80',
    title: 'Find your sweet stay',
    text: 'Subscribe to access property discount coupons. Generate unique coupons and save on your stay.',
  },
  {
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
    title: 'Exclusive member deals',
    text: 'Get instant access to curated discounts at handpicked properties. No hidden fees.',
  },
  {
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80',
    title: 'Save more, travel more',
    text: 'Join thousands of travelers who unlock better rates with Busy Beds coupons.',
  },
];

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
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setSlideIndex((i) => (i + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      {/* Glassy dark container */}
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-900/95 shadow-2xl backdrop-blur-xl">
        <div className="flex min-h-[600px] flex-col lg:flex-row">
          {/* Left panel - slider */}
          <div className="relative hidden w-full lg:block lg:w-1/2 overflow-hidden">
            {SLIDES.map((slide, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  i === slideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  priority={i === 0}
                  sizes="50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute left-8 bottom-12 right-8">
                  <h2 className="text-2xl font-bold text-white md:text-3xl">
                    {slide.title}
                  </h2>
                  <p className="mt-2 text-white/90">
                    {slide.text}
                  </p>
                </div>
              </div>
            ))}
            <div className="absolute left-8 bottom-8 z-20 flex gap-2">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlideIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === slideIndex ? 'w-8 bg-white' : 'w-6 bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
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
