'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80',
    title: 'Find your sweet stay',
    text: 'Subscribe to access exclusive property discounts. Save on every booking.',
  },
  {
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
    title: 'Exclusive member deals',
    text: 'Get instant access to curated discounts at handpicked properties worldwide.',
  },
  {
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80',
    title: 'Save more, travel more',
    text: 'Join thousands of travelers who travel better and stay for less with Busy Beds.',
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
    }, 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4 lg:p-8">
      {/* Container with premium glassmorphism */}
      <div className="w-full max-w-6xl overflow-hidden rounded-[2rem] border border-glass-border bg-glass-bg shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] backdrop-blur-2xl">
        <div className="flex min-h-[700px] flex-col lg:flex-row">

          {/* Left panel - Immersive slider */}
          <div className="relative hidden w-full lg:block lg:w-[55%] overflow-hidden">
            {SLIDES.map((slide, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${i === slideIndex ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute left-10 bottom-16 right-10">
                  <div className="overflow-hidden">
                    <h2 className="text-3xl font-bold text-white md:text-4xl translate-y-0 transition-transform duration-700 delay-300 tracking-tight">
                      {slide.title}
                    </h2>
                  </div>
                  <p className="mt-4 text-white/80 text-lg max-w-md">
                    {slide.text}
                  </p>
                </div>
              </div>
            ))}

            {/* Logo overlay on top of slider */}
            <div className="absolute top-10 left-10 z-20">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                  <span className="text-primary font-bold text-xl">B</span>
                </div>
                <span className="text-white font-bold text-2xl tracking-tight">Busy Beds</span>
              </Link>
            </div>

            {/* Slider navigation */}
            <div className="absolute left-10 bottom-10 z-20 flex items-center gap-3">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlideIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ease-out ${i === slideIndex ? 'w-10 bg-white' : 'w-4 bg-white/30 hover:bg-white/50'
                    }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right panel - Clean, professional form area */}
          <div className="flex flex-1 flex-col justify-center px-6 py-10 lg:px-16 lg:py-20 bg-card/40">
            <div className="mx-auto w-full max-w-sm">
              <div className="lg:hidden mb-8">
                <Link href="/" className="flex items-center gap-2 group">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm">B</span>
                  </div>
                  <span className="text-foreground font-bold text-xl tracking-tight">Busy Beds</span>
                </Link>
              </div>

              {!hideTopButton && (
                <div className="mb-10 flex justify-end">
                  <Link
                    href={switchLink}
                    className="group relative inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary-light"
                  >
                    <span className="text-muted group-hover:text-primary transition-colors">{switchText}</span>
                    <span className="text-primary">{switchLabel}</span>
                  </Link>
                </div>
              )}

              <div className="space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
                <p className="text-muted text-lg">{subtitle}</p>
              </div>

              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {children}
              </div>

              {hideTopButton && (
                <p className="mt-10 text-center text-sm text-muted">
                  {switchText}{' '}
                  <Link href={switchLink} className="font-bold text-primary hover:text-primary-hover transition-colors underline-offset-4 hover:underline">
                    {switchLabel}
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
