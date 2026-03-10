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
  const list = images?.length ? images : [PLACEHOLDER];

  return (
    <div className="space-y-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-100">
        <Image
          src={list[selected]}
          alt={`${hotelName} - Photo ${selected + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 800px"
          unoptimized={!list[selected].includes('images.unsplash.com')}
        />
      </div>
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {list.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                selected === i ? 'border-zinc-900' : 'border-zinc-200'
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
  );
}
