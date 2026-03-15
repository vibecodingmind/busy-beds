'use client';

import { useCallback, useMemo, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import Link from 'next/link';
import type { Hotel } from '@/lib/api';
import StarRating from '@/components/StarRating';
import { useGoogleMapsApiKey } from '@/hooks/usePublicSettings';

const mapContainerStyle = { width: '100%', height: '100%' };

interface HotelsMapInnerProps {
  hotels: (Hotel & { latitude: number; longitude: number })[];
}

function getBoundsCenter(hotels: { latitude: number; longitude: number }[]) {
  if (hotels.length === 0) return { lat: 37.7749, lng: -122.4194 };
  if (hotels.length === 1) return { lat: hotels[0].latitude, lng: hotels[0].longitude };
  const lats = hotels.map((h) => h.latitude);
  const lngs = hotels.map((h) => h.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
}

function HotelsMapInnerLoaded({
  apiKey,
  hotels,
}: HotelsMapInnerProps & { apiKey: string }) {
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  const center = useMemo(() => getBoundsCenter(hotels), [hotels]);

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      if (hotels.length === 0) return;
      const bounds = new google.maps.LatLngBounds();
      hotels.forEach((h) => bounds.extend({ lat: h.latitude, lng: h.longitude }));
      map.fitBounds(bounds);
      const z = map.getZoom();
      if (z && z > 14) map.setZoom(14);
    },
    [hotels]
  );

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-sm">
        Loading map…
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={10}
      onLoad={onMapLoad}
      options={{ scrollwheel: true, fullscreenControl: true, zoomControl: true }}
    >
      {hotels.map((hotel) => (
        <Marker
          key={hotel.id}
          position={{ lat: hotel.latitude, lng: hotel.longitude }}
          onClick={() => setSelectedHotelId(hotel.id)}
        />
      ))}
      {selectedHotelId != null && (() => {
        const hotel = hotels.find((h) => h.id === selectedHotelId);
        if (!hotel) return null;
        return (
          <InfoWindow
            position={{ lat: hotel.latitude, lng: hotel.longitude }}
            onCloseClick={() => setSelectedHotelId(null)}
          >
            <div className="min-w-[200px] p-1">
              <Link
                href={`/hotels/${hotel.id}`}
                className="font-semibold text-primary hover:underline"
                onClick={() => setSelectedHotelId(null)}
              >
                {hotel.name}
              </Link>
              {hotel.location && (
                <p className="mt-1 text-sm text-gray-700">{hotel.location}</p>
              )}
              <div className="mt-1 flex items-center gap-2">
                {hotel.avg_rating != null && hotel.review_count != null && hotel.review_count > 0 && (
                  <StarRating rating={Number(hotel.avg_rating)} size="sm" />
                )}
                <span className="text-sm font-medium text-primary">{hotel.coupon_discount_value}</span>
              </div>
            </div>
          </InfoWindow>
        );
      })()}
    </GoogleMap>
  );
}

export default function HotelsMapInner(props: HotelsMapInnerProps) {
  const apiKey = useGoogleMapsApiKey();
  if (!apiKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-sm">
        Loading map…
      </div>
    );
  }
  return <HotelsMapInnerLoaded apiKey={apiKey} {...props} />;
}
