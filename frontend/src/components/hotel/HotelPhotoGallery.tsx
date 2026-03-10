'use client';

import { useState } from 'react';
import Image from 'next/image';

interface HotelPhotoGalleryProps {
  images: string[];
  hotelName: string;
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';

export default function HotelPhotoGallery({ images, hotelName }: HotelPhotoGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const list = images?.length ? images : [PLACEHOLDER];

  // Airbnb-style asymmetric grid: hero left (2 rows) + 2 stacked right + 2 below
  const mainImg = list[0];
  const rightTop = list[1] || mainImg;
  const rightBottom = list[2] || mainImg;
  const bottomLeft = list[3] || mainImg;
  const bottomRight = list[4] || mainImg;

  return (
    <div className="space-y-0">
      {/* Main grid - Airbnb style: hero | top, hero | bottom, small1 | small2 */}
      <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-xl md:grid-cols-[2fr_1fr]">
        {/* Hero - left, spans 2 rows */}
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="relative row-span-2 min-h-[200px] overflow-hidden bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 md:aspect-[4/3] md:min-h-0"
        >
          <Image
            src={list[selected] || mainImg}
            alt={`${hotelName} - Photo ${selected + 1}`}
            fill
            className="object-cover transition-transform hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 66vw"
            unoptimized={!(list[selected] || mainImg)?.includes('images.unsplash.com')}
          />
          {/* Show all photos - overlay on hero, dark bg for visibility */}
          <div className="absolute bottom-4 right-4">
            <span className="flex items-center gap-2 rounded-lg bg-black/80 px-4 py-2 text-sm font-medium text-white shadow-lg">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Show all photos
            </span>
          </div>
        </button>
        {/* Top right */}
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="relative aspect-square overflow-hidden bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 md:aspect-auto md:min-h-0"
        >
          <Image
            src={rightTop}
            alt={`${hotelName} - Photo 2`}
            fill
            className="object-cover transition-transform hover:scale-[1.02]"
            sizes="(max-width: 768px) 50vw, 33vw"
            unoptimized={!rightTop.includes('images.unsplash.com')}
          />
        </button>
        {/* Bottom right */}
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="relative aspect-square overflow-hidden bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 md:aspect-auto md:min-h-0"
        >
          <Image
            src={rightBottom}
            alt={`${hotelName} - Photo 3`}
            fill
            className="object-cover transition-transform hover:scale-[1.02]"
            sizes="(max-width: 768px) 50vw, 33vw"
            unoptimized={!rightBottom.includes('images.unsplash.com')}
          />
        </button>
        {/* Bottom row - two smaller images */}
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="relative col-span-2 aspect-[16/9] overflow-hidden bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 md:col-span-1"
        >
          <Image
            src={bottomLeft}
            alt={`${hotelName} - Photo 4`}
            fill
            className="object-cover transition-transform hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized={!bottomLeft.includes('images.unsplash.com')}
          />
        </button>
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="relative col-span-2 aspect-[16/9] overflow-hidden bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 md:col-span-1"
        >
          <Image
            src={bottomRight}
            alt={`${hotelName} - Photo 5`}
            fill
            className="object-cover transition-transform hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized={!bottomRight.includes('images.unsplash.com')}
          />
        </button>
      </div>

      {/* Thumbnails strip - for quick preview when many images */}
      {list.length > 1 && list.length <= 10 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {list.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={`relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                selected === i ? 'border-[var(--primary)]' : 'border-zinc-200 dark:border-zinc-600'
              }`}
            >
              <Image
                src={url}
                alt={`${hotelName} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
                unoptimized={!url.includes('images.unsplash.com')}
              />
            </button>
          ))}
        </div>
      )}

      {/* Full-screen gallery modal */}
      {showAll && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-900"
          role="dialog"
          aria-label="Photo gallery"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {selected + 1} / {list.length}
            </span>
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="rounded-full p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              aria-label="Close gallery"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="relative flex-1 overflow-auto p-4">
            <Image
              src={list[selected]}
              alt={`${hotelName} - Photo ${selected + 1}`}
              width={1200}
              height={800}
              className="mx-auto max-h-full w-auto object-contain"
              unoptimized={!list[selected].includes('images.unsplash.com')}
            />
          </div>
          {list.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-t border-zinc-200 p-4 dark:border-zinc-700">
              {list.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected(i)}
                  className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                    selected === i ? 'border-[var(--primary)]' : 'border-transparent'
                  }`}
                >
                  <Image
                    src={url}
                    alt={`${hotelName} thumbnail ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized={!url.includes('images.unsplash.com')}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
