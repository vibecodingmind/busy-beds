import Link from 'next/link';
import { hotels } from '@/lib/api';
import type { Hotel } from '@/lib/api';
import GetCouponButton from './GetCouponButton';
import HotelPhotoGallery from '@/components/hotel/HotelPhotoGallery';
import FavoriteButton from '@/components/hotel/FavoriteButton';
import HotelMap from '@/components/hotel/HotelMap';
import RecentlyViewedTracker from '@/components/hotel/RecentlyViewedTracker';
import HotelDistance from '@/components/hotel/HotelDistance';
import HotelReviews from '@/components/hotel/HotelReviews';
import ShareButton from '@/components/hotel/ShareButton';

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
      <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">Hotel not found.</p>
        <Link href="/hotels" className="mt-4 inline-block text-[#FF385C] hover:underline">
          Back to hotels
        </Link>
      </div>
    );
  }

  const hasCoords = hotel.latitude != null && hotel.longitude != null;

  return (
    <div className="min-h-screen bg-[#f7f7f7] dark:bg-zinc-950">
      <RecentlyViewedTracker hotelId={hotel.id} />
      <Link
        href="/hotels"
        className="mb-4 inline-block text-sm text-[#FF385C] hover:underline"
      >
        ← Back to hotels
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Left column - main content */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 md:p-8">
            {/* Title row with Share and Save */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 md:text-3xl">
                  {hotel.name}
                </h1>
                {(hotel.avg_rating != null && hotel.review_count != null && hotel.review_count > 0) && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="text-amber-500">★</span>
                    {Number(hotel.avg_rating).toFixed(1)} ({hotel.review_count} reviews)
                  </p>
                )}
                {hotel.location && (
                  <p className="mt-1 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <svg className="h-4 w-4 flex-shrink-0 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {hotel.location}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <ShareButton hotelId={hotel.id} hotelName={hotel.name} />
                <FavoriteButton hotelId={hotel.id} />
              </div>
            </div>

            {/* Photo gallery */}
            <div className="mt-6">
              <HotelPhotoGallery images={hotel.images || []} hotelName={hotel.name} />
            </div>

            {hotel.description && (
              <p className="mt-6 text-zinc-600 dark:text-zinc-400">{hotel.description}</p>
            )}

            {hasCoords && (
              <div className="mt-4">
                <HotelDistance latitude={hotel.latitude!} longitude={hotel.longitude!} />
              </div>
            )}

            {(hotel.contact_phone || hotel.contact_email || hotel.contact_whatsapp) && (
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Contact</h3>
                <div className="flex flex-wrap gap-6">
                  {hotel.contact_phone && (
                    <a href={`tel:${hotel.contact_phone}`} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {hotel.contact_phone}
                    </a>
                  )}
                  {hotel.contact_email && (
                    <a href={`mailto:${hotel.contact_email}`} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {hotel.contact_email}
                    </a>
                  )}
                  {hotel.contact_whatsapp && (
                    <a
                      href={`https://wa.me/${hotel.contact_whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    >
                      <svg className="h-5 w-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}

            {hasCoords && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Location</h3>
                <HotelMap
                  latitude={hotel.latitude!}
                  longitude={hotel.longitude!}
                  hotelName={hotel.name}
                  location={hotel.location}
                />
              </div>
            )}

            <HotelReviews hotelId={hotel.id} hotelName={hotel.name} />
          </div>
        </div>

        {/* Right sidebar - sticky booking widget with Get Coupon */}
        <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-96">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            {/* Coupon discount preview */}
            <div className="rounded-lg bg-[#fff1f2] p-4 dark:bg-zinc-800">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Save with coupon</p>
              <p className="mt-1 text-xl font-bold text-[#FF385C]">{hotel.coupon_discount_value}</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Show QR code at check-in to redeem
              </p>
            </div>

            {/* Get Coupon - prominent CTA */}
            <div className="mt-4">
              <GetCouponButton hotelId={hotel.id} hotelName={hotel.name} />
            </div>

            {hotel.booking_url && (
              <a
                href={hotel.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#FF385C] bg-white px-4 py-3 font-medium text-[#FF385C] transition-colors hover:bg-[#fff1f2] dark:border-[#FF385C] dark:bg-transparent dark:hover:bg-zinc-800"
              >
                Book now
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            <div className="mt-4 flex justify-center">
              <ShareButton hotelId={hotel.id} hotelName={hotel.name} className="border-0 px-2 py-1" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
