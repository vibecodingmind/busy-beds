import Link from 'next/link';
import { hotels } from '@/lib/api';
import type { Hotel } from '@/lib/api';
import GetCouponButton from './GetCouponButton';
import HotelPhotoGallery from '@/components/hotel/HotelPhotoGallery';
import HotelMap from '@/components/hotel/HotelMap';
import HotelDistance from '@/components/hotel/HotelDistance';
import HotelReviews from '@/components/hotel/HotelReviews';

export const dynamic = 'force-dynamic';

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let hotel: Hotel | null = null;
  try {
    hotel = await hotels.get(parseInt(id));
  } catch {
    hotel = null;
  }

  if (!hotel) {
    return (
      <div>
        <p className="text-zinc-600">Hotel not found.</p>
        <Link href="/hotels" className="mt-4 text-emerald-600 hover:underline">
          Back to hotels
        </Link>
      </div>
    );
  }

  const hasCoords = hotel.latitude != null && hotel.longitude != null;

  return (
    <div>
      <Link href="/hotels" className="text-sm text-emerald-600 hover:underline">
        ← Back to hotels
      </Link>
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">{hotel.name}</h1>

        <div className="mt-6">
          <HotelPhotoGallery images={hotel.images || []} hotelName={hotel.name} />
        </div>

        {hotel.description && (
          <p className="mt-6 text-zinc-600">{hotel.description}</p>
        )}

        {hotel.location && (
          <p className="mt-2 flex items-center gap-2 text-zinc-600">
            <svg className="h-4 w-4 flex-shrink-0 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {hotel.location}
          </p>
        )}

        {hasCoords && (
          <div className="mt-2">
            <HotelDistance latitude={hotel.latitude!} longitude={hotel.longitude!} />
          </div>
        )}

        {(hotel.contact_phone || hotel.contact_email) && (
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-medium text-zinc-700">Contact</h3>
            <div className="flex flex-wrap gap-6">
              {hotel.contact_phone && (
                <a href={`tel:${hotel.contact_phone}`} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {hotel.contact_phone}
                </a>
              )}
              {hotel.contact_email && (
                <a href={`mailto:${hotel.contact_email}`} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {hotel.contact_email}
                </a>
              )}
            </div>
          </div>
        )}

        {hotel.booking_url && (
          <a
            href={hotel.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
          >
            Book now
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        <p className="mt-6 font-semibold text-emerald-600">
          Coupon discount: {hotel.coupon_discount_value}
        </p>

        {hasCoords && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-medium text-zinc-700">Location</h3>
            <HotelMap
              latitude={hotel.latitude!}
              longitude={hotel.longitude!}
              hotelName={hotel.name}
              location={hotel.location}
            />
          </div>
        )}

        <div className="mt-8">
          <GetCouponButton hotelId={hotel.id} hotelName={hotel.name} />
        </div>

        <HotelReviews hotelId={hotel.id} />
      </div>
    </div>
  );
}
