'use client';

import { useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useGoogleMapsApiKey } from '@/hooks/usePublicSettings';

const mapContainerStyle = { width: '100%', height: '100%' };

interface HotelMapInnerProps {
  latitude: number;
  longitude: number;
  hotelName: string;
  location?: string | null;
}

function HotelMapInnerLoaded({
  apiKey,
  latitude,
  longitude,
  hotelName,
  location,
}: HotelMapInnerProps & { apiKey: string }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });
  const center = useMemo(() => ({ lat: latitude, lng: longitude }), [latitude, longitude]);

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
      zoom={14}
      options={{ scrollwheel: false, fullscreenControl: true, zoomControl: true }}
    >
      <Marker position={center} />
      <InfoWindow position={center}>
        <div className="p-1 min-w-[160px]">
          <strong className="font-semibold text-gray-900">{hotelName}</strong>
          {location && <p className="mt-1 text-sm text-gray-700">{location}</p>}
        </div>
      </InfoWindow>
    </GoogleMap>
  );
}

export default function HotelMapInner(props: HotelMapInnerProps) {
  const apiKey = useGoogleMapsApiKey();
  if (!apiKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-sm">
        Loading map…
      </div>
    );
  }
  return <HotelMapInnerLoaded apiKey={apiKey} {...props} />;
}
