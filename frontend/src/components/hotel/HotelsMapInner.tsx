'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import type { Hotel } from '@/lib/api';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface HotelsMapInnerProps {
  hotels: (Hotel & { latitude: number; longitude: number })[];
}

function getBoundsCenter(hotels: { latitude: number; longitude: number }[]) {
  if (hotels.length === 0) return [37.7749, -122.4194] as [number, number];
  if (hotels.length === 1) return [hotels[0].latitude, hotels[0].longitude] as [number, number];
  const lats = hotels.map((h) => h.latitude);
  const lngs = hotels.map((h) => h.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return [(minLat + maxLat) / 2, (minLng + maxLng) / 2] as [number, number];
}

function getZoom(hotels: { latitude: number; longitude: number }[]): number {
  if (hotels.length <= 1) return 14;
  const lats = hotels.map((h) => h.latitude);
  const lngs = hotels.map((h) => h.longitude);
  const span = Math.max(
    Math.abs(Math.max(...lats) - Math.min(...lats)),
    Math.abs(Math.max(...lngs) - Math.min(...lngs))
  );
  if (span > 10) return 4;
  if (span > 2) return 6;
  if (span > 0.5) return 8;
  if (span > 0.1) return 10;
  if (span > 0.05) return 12;
  return 14;
}

export default function HotelsMapInner({ hotels }: HotelsMapInnerProps) {
  const center = getBoundsCenter(hotels);
  const zoom = getZoom(hotels);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hotels.map((hotel) => (
        <Marker key={hotel.id} position={[hotel.latitude, hotel.longitude]}>
          <Popup>
            <div className="min-w-[200px]">
              <Link href={`/hotels/${hotel.id}`} className="font-semibold text-emerald-600 hover:underline">
                {hotel.name}
              </Link>
              {hotel.location && <p className="mt-1 text-sm text-zinc-600">{hotel.location}</p>}
              <p className="mt-1 text-sm font-medium text-emerald-600">{hotel.coupon_discount_value}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
