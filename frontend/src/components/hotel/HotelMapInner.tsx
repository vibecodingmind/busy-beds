'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface HotelMapInnerProps {
  latitude: number;
  longitude: number;
  hotelName: string;
  location?: string | null;
}

export default function HotelMapInner({ latitude, longitude, hotelName, location }: HotelMapInnerProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={14}
      className="h-full w-full"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]}>
        <Popup>
          <strong>{hotelName}</strong>
          {location && <p className="mt-1 text-sm text-zinc-600">{location}</p>}
        </Popup>
      </Marker>
    </MapContainer>
  );
}
