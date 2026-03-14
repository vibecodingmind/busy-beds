'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import type { Hotel } from '@/lib/api';
import { useGoogleMapsApiKey } from '@/hooks/usePublicSettings';

const mapContainerStyle = { width: '100%', height: '100%' };

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface SplitMapViewProps {
  hotels: Hotel[];
  selectedHotelId: number | null;
  onMarkerClick: (hotelId: number) => void;
  onBoundsChange: (bounds: MapBounds) => void;
}

function getBoundsCenter(hotels: { latitude: number | null; longitude: number | null }[]) {
  const withCoords = hotels.filter((h) => h.latitude != null && h.longitude != null);
  if (withCoords.length === 0) return { lat: 37.7749, lng: -122.4194 };
  if (withCoords.length === 1) return { lat: withCoords[0].latitude!, lng: withCoords[0].longitude! };
  const lats = withCoords.map((h) => h.latitude!);
  const lngs = withCoords.map((h) => h.longitude!);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
}

function SplitMapViewLoaded({
  apiKey,
  hotels,
  selectedHotelId,
  onMarkerClick,
  onBoundsChange,
}: SplitMapViewProps & { apiKey: string }) {
  const [mounted, setMounted] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<Map<number, google.maps.Marker>>(new Map());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCalledBoundsChange = useRef(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  const hotelsWithCoords = useMemo(
    () => hotels.filter((h): h is Hotel & { latitude: number; longitude: number } => 
      h.latitude != null && h.longitude != null
    ),
    [hotels]
  );

  const center = useMemo(() => getBoundsCenter(hotelsWithCoords), [hotelsWithCoords]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mapInstance || !isLoaded || !hasCalledBoundsChange.current) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const bounds = mapInstance.getBounds();
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        onBoundsChange({
          north: ne.lat(),
          south: sw.lat(),
          east: ne.lng(),
          west: sw.lng(),
        });
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [mapInstance, isLoaded, onBoundsChange]);

  useEffect(() => {
    if (!mapInstance || hotelsWithCoords.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    hotelsWithCoords.forEach((h) => bounds.extend({ lat: h.latitude, lng: h.longitude }));
    mapInstance.fitBounds(bounds);
    hasCalledBoundsChange.current = true;
    const z = mapInstance.getZoom();
    if (z && z > 14) mapInstance.setZoom(14);
  }, [mapInstance, hotelsWithCoords]);

  useEffect(() => {
    if (!selectedHotelId || !mapInstance || !isLoaded) return;
    const hotel = hotels.find((h) => h.id === selectedHotelId);
    if (hotel?.latitude && hotel?.longitude) {
      setSelectedHotel(hotel);
    }
  }, [selectedHotelId, hotels, mapInstance, isLoaded]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
    hasCalledBoundsChange.current = false;
  }, []);

  const onMapIdle = useCallback(() => {
    hasCalledBoundsChange.current = true;
  }, []);

  const handleMarkerClick = useCallback((hotelId: number, hotel: Hotel) => {
    onMarkerClick(hotelId);
    setSelectedHotel(hotel);
  }, [onMarkerClick]);

  if (!mounted) {
    return (
      <div className="h-full w-full animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-sm">
        Loading map...
      </div>
    );
  }

  if (hotelsWithCoords.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-black/10 bg-white dark:border-zinc-700 dark:bg-zinc-900/50">
        <p className="text-black dark:text-zinc-400">No hotels with location data</p>
        <p className="mt-2 text-sm text-black dark:text-zinc-400">Browse the list view to see all properties</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-black/10 dark:border-zinc-700">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={10}
        onLoad={onMapLoad}
        onIdle={onMapIdle}
        options={{
          scrollwheel: true,
          fullscreenControl: true,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
        }}
      >
        {hotelsWithCoords.map((hotel) => (
          <Marker
            key={hotel.id}
            position={{ lat: hotel.latitude, lng: hotel.longitude }}
            title={hotel.name}
            onClick={() => handleMarkerClick(hotel.id, hotel)}
          />
        ))}
        {selectedHotel && (
          <InfoWindow
            position={{ lat: selectedHotel.latitude!, lng: selectedHotel.longitude! }}
            onCloseClick={() => setSelectedHotel(null)}
          >
            <div className="min-w-[200px] max-w-[250px] p-1">
              <Link
                href={`/hotels/${selectedHotel.id}`}
                className="font-semibold text-primary hover:underline block truncate"
                onClick={() => setSelectedHotel(null)}
              >
                {selectedHotel.name}
              </Link>
              {selectedHotel.location && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 truncate">{selectedHotel.location}</p>
              )}
              <div className="mt-1 flex items-center gap-2">
                {selectedHotel.avg_rating != null && (
                  <span className="text-sm font-medium">★ {Number(selectedHotel.avg_rating).toFixed(1)}</span>
                )}
                <span className="text-sm font-bold text-primary">{selectedHotel.coupon_discount_value}</span>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

export default function SplitMapView(props: SplitMapViewProps) {
  const apiKey = useGoogleMapsApiKey();

  if (!apiKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-sm">
        Loading map...
      </div>
    );
  }

  return <SplitMapViewLoaded apiKey={apiKey} {...props} />;
}
