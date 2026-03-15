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
import HotelRooms from './HotelRooms';
import StarRating from '@/components/StarRating';

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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-12">
          <svg className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <p className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">Property not found</p>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">This property may have been removed or does not exist.</p>
          <Link href="/hotels" className="mt-6 inline-block rounded-xl bg-primary px-6 py-2.5 font-medium text-white hover:opacity-90">
            Browse Properties
          </Link>
        </div>
      </div>
    );
  }

  const hasCoords = hotel.latitude != null && hotel.longitude != null;
  const locationParts = [
    (hotel as any).city,
    (hotel as any).region,
    (hotel as any).country,
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <RecentlyViewedTracker hotelId={hotel.id} />

      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronIcon />
        <Link href="/hotels" className="hover:text-primary transition-colors">Properties</Link>
        {locationParts.map((part, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronIcon />
            <span className={i === locationParts.length - 1 ? 'text-foreground font-medium' : ''}>{part}</span>
          </span>
        ))}
        {locationParts.length === 0 && hotel.location && (
          <>
            <ChevronIcon />
            <span className="text-foreground font-medium">{hotel.location}</span>
          </>
        )}
        <ChevronIcon />
        <span className="text-foreground font-medium truncate max-w-[200px]">{hotel.name}</span>
      </nav>

      {/* FULL-WIDTH Photo Gallery */}
      <div className="w-full mb-6 -mx-0">
        <HotelPhotoGallery images={hotel.images || []} hotelName={hotel.name} />
      </div>

      {/* Main two-column layout */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

        {/* ── Left column ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Header card */}
          <div className="rounded-2xl border border-black/10 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-black dark:text-zinc-100 md:text-4xl leading-tight">
                  {hotel.name}
                </h1>

                {/* Location hierarchy */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <PinIcon />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {locationParts.length > 0
                      ? locationParts.join(', ')
                      : hotel.location || 'Location not specified'}
                  </span>
                  {hotel.location && locationParts.length > 0 && (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">· {hotel.location}</span>
                  )}
                </div>

                {/* Rating row */}
                {hotel.avg_rating != null && hotel.review_count != null && hotel.review_count > 0 && (
                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 border border-amber-200 dark:border-amber-800/40">
                      <StarRating rating={Number(hotel.avg_rating)} size="sm" />
                      <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                        {Number(hotel.avg_rating).toFixed(1)}
                      </span>
                      <span className="text-sm text-amber-700 dark:text-amber-400">
                        · {hotel.review_count} review{hotel.review_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {hotel.redemptions_this_month != null && hotel.redemptions_this_month > 0 && (
                      <span className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 px-3 py-1.5 text-sm text-emerald-700 dark:text-emerald-300">
                        🔥 {hotel.redemptions_this_month} redemption{hotel.redemptions_this_month !== 1 ? 's' : ''} this month
                      </span>
                    )}
                  </div>
                )}

                {hotel.avg_response_hours != null && hotel.avg_response_hours >= 0 && (
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <ClockIcon />
                    Usually responds within {Math.round(hotel.avg_response_hours)} hour{Math.round(hotel.avg_response_hours) !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <ShareButton hotelId={hotel.id} hotelName={hotel.name} />
                <FavoriteButton hotelId={hotel.id} />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <ShareButton hotelId={hotel.id} hotelName={hotel.name} />
                <FavoriteButton hotelId={hotel.id} />
              </div>
            </div>

            {/* Social Media Links */}
            {(hotel.social_facebook || hotel.social_instagram || hotel.social_x || hotel.social_linkedin || hotel.social_tiktok) && (
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-black/5 dark:border-white/5 pt-4">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Follow us:</span>
                {hotel.social_facebook && (
                  <a href={hotel.social_facebook} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-[#1877F2] transition-colors" title="Facebook">
                    <FacebookIcon />
                  </a>
                )}
                {hotel.social_instagram && (
                  <a href={hotel.social_instagram} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-[#E4405F] transition-colors" title="Instagram">
                    <InstagramIcon />
                  </a>
                )}
                {hotel.social_x && (
                  <a href={hotel.social_x} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors" title="X (Twitter)">
                    <XIcon />
                  </a>
                )}
                {hotel.social_linkedin && (
                  <a href={hotel.social_linkedin} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-[#0A66C2] transition-colors" title="LinkedIn">
                    <LinkedInIcon />
                  </a>
                )}
                {hotel.social_tiktok && (
                  <a href={hotel.social_tiktok} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors" title="TikTok">
                    <TikTokIcon />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {hotel.description && (
            <div className="rounded-2xl border border-black/10 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-6 md:p-8">
              <h2 className="text-lg font-semibold text-black dark:text-zinc-100 mb-3">About this property</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{hotel.description}</p>
            </div>
          )}

          {/* Rooms & Pricing */}
          <div className="rounded-2xl border border-black/10 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-6 md:p-8">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-100 mb-4">Rooms & Pricing</h2>
            <HotelRooms hotelId={hotel.id} discountValue={hotel.coupon_discount_value} />
          </div>

          {/* Distance from me */}
          {hasCoords && (
            <div className="rounded-2xl border border-black/10 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-6 md:p-8">
              <HotelDistance latitude={hotel.latitude!} longitude={hotel.longitude!} />
            </div>
          )}

          {/* Contact */}
          {(hotel.contact_phone || hotel.contact_email || hotel.contact_whatsapp) && (
            <div className="rounded-2xl border border-black/10 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-6 md:p-8">
              <h2 className="text-lg font-semibold text-black dark:text-zinc-100 mb-4">Contact</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {hotel.contact_phone && (
                  <a
                    href={`tel:${hotel.contact_phone}`}
                    className="flex items-center gap-3 rounded-xl border border-black/10 dark:border-zinc-700 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100">
                      <PhoneIcon />
                    </span>
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Phone</p>
                      <p className="text-sm font-medium text-black dark:text-zinc-200">{hotel.contact_phone}</p>
                    </div>
                  </a>
                )}
                {hotel.contact_email && (
                  <a
                    href={`mailto:${hotel.contact_email}`}
                    className="flex items-center gap-3 rounded-xl border border-black/10 dark:border-zinc-700 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:bg-purple-100">
                      <EmailIcon />
                    </span>
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Email</p>
                      <p className="text-sm font-medium text-black dark:text-zinc-200 truncate max-w-[140px]">{hotel.contact_email}</p>
                    </div>
                  </a>
                )}
                {hotel.contact_whatsapp && (
                  <a
                    href={`https://wa.me/${hotel.contact_whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-black/10 dark:border-zinc-700 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-[#25D366] group-hover:bg-emerald-100">
                      <WhatsAppIcon />
                    </span>
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">WhatsApp</p>
                      <p className="text-sm font-medium text-black dark:text-zinc-200">{hotel.contact_whatsapp}</p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Map */}
          {hasCoords && (
            <div className="rounded-2xl border border-black/10 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-6 md:p-8">
              <h2 className="text-lg font-semibold text-black dark:text-zinc-100 mb-4">Location</h2>
              {locationParts.length > 0 && (
                <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">{locationParts.join(' › ')}</p>
              )}
              <HotelMap
                latitude={hotel.latitude!}
                longitude={hotel.longitude!}
                hotelName={hotel.name}
                location={hotel.location}
              />
            </div>
          )}

          {/* Reviews */}
          <div className="rounded-2xl border border-black/10 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-6 md:p-8">
            <HotelReviews hotelId={hotel.id} hotelName={hotel.name} />
          </div>
        </div>

        {/* ── Right sidebar ──────────────────────────────────────── */}
        <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-[360px] space-y-4">

          {/* Coupon / booking widget */}
          <div className="rounded-2xl border border-black/10 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-6 shadow-lg">
            {/* Discount highlight */}
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4 mb-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-primary/70">Member discount</p>
                  <p className="mt-1 text-3xl font-bold text-primary">{hotel.coupon_discount_value}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Show QR code at check-in</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <TicketIcon />
                </div>
              </div>
            </div>

            {/* Rating */}
            {hotel.avg_rating != null && hotel.review_count != null && hotel.review_count > 0 && (
              <div className="mb-4 flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <StarRating rating={Number(hotel.avg_rating)} size="sm" />
                  <span className="font-semibold text-black dark:text-zinc-100">{Number(hotel.avg_rating).toFixed(1)}</span>
                </div>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">{hotel.review_count} review{hotel.review_count !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Primary CTA */}
            <GetCouponButton hotelId={hotel.id} hotelName={hotel.name} />

            {hotel.booking_url && (
              <a
                href={hotel.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black/10 dark:border-zinc-600 bg-transparent px-4 py-3 font-medium text-black dark:text-zinc-100 transition-colors hover:border-black/20 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Book directly
                <ExternalLinkIcon />
              </a>
            )}

            {/* Third Party Bookings */}
            {(hotel.booking_airbnb || hotel.booking_bookingcom || hotel.booking_agoda || hotel.booking_expedia) && (
              <div className="mt-6 pt-5 border-t border-black/5 dark:border-white/5">
                <p className="text-sm font-semibold text-black dark:text-zinc-100 mb-3 uppercase tracking-wider">Or book via our partners</p>
                <div className="flex flex-col gap-2.5">
                  {hotel.booking_bookingcom && (
                    <a href={hotel.booking_bookingcom} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#003580] dark:text-[#337ab7] hover:underline font-medium">
                      <ExternalLinkIcon /> Booking.com
                    </a>
                  )}
                  {hotel.booking_airbnb && (
                    <a href={hotel.booking_airbnb} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#FF5A5F] hover:underline font-medium">
                      <ExternalLinkIcon /> Airbnb
                    </a>
                  )}
                  {hotel.booking_agoda && (
                    <a href={hotel.booking_agoda} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#2a82c6] dark:text-[#42a5f5] hover:underline font-medium">
                      <ExternalLinkIcon /> Agoda
                    </a>
                  )}
                  {hotel.booking_expedia && (
                    <a href={hotel.booking_expedia} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#0000A0] dark:text-[#5c6bc0] hover:underline font-medium">
                      <ExternalLinkIcon /> Expedia
                    </a>
                  )}
                </div>
                <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 italic">
                  Note: App discount coupons only apply to direct bookings.
                </p>
              </div>
            )}

            <div className="mt-4 flex justify-center">
              <ShareButton hotelId={hotel.id} hotelName={hotel.name} className="border-0 px-2 py-1 text-zinc-500" />
            </div>
          </div>

          {/* Property quick-facts */}
          <div className="rounded-2xl border border-black/10 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-6">
            <h3 className="text-sm font-semibold text-black dark:text-zinc-100 mb-3 uppercase tracking-wider">Quick Facts</h3>
            <ul className="space-y-2.5 text-sm">
              {locationParts.length > 0 && (
                <li className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400">
                  <PinIcon />
                  <span>{locationParts.join(', ')}</span>
                </li>
              )}
              {hotel.location && (
                <li className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400">
                  <span className="mt-0.5">📍</span>
                  <span>{hotel.location}</span>
                </li>
              )}
              {hotel.contact_phone && (
                <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <PhoneIcon />
                  <a href={`tel:${hotel.contact_phone}`} className="hover:text-primary transition-colors">{hotel.contact_phone}</a>
                </li>
              )}
              {hotel.contact_email && (
                <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <EmailIcon />
                  <a href={`mailto:${hotel.contact_email}`} className="hover:text-primary transition-colors truncate max-w-[240px]">{hotel.contact_email}</a>
                </li>
              )}
              {hotel.avg_response_hours != null && hotel.avg_response_hours >= 0 && (
                <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <ClockIcon />
                  <span>Responds in ~{Math.round(hotel.avg_response_hours)}h</span>
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ── Inline icon components ─────────────────────────────────── */

function ChevronIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.78-1.15 5.54-3.33 7.23-1.9 1.5-4.56 2.12-6.9 1.47-2.73-.72-5.01-2.91-5.71-5.63-.73-2.61-.1-5.59 1.68-7.61 1.76-2.06 4.67-3.05 7.37-2.67.65.09 1.28.25 1.89.47v4.45c-2.34-.84-5.22-.05-6.68 2.06-1.28 1.72-.94 4.3 0 5.86 1.01 1.75 3.33 2.5 5.24 1.78 1.65-.58 2.75-2.26 2.77-4.04.05-5.91-.04-11.82.04-17.73z" />
    </svg>
  );
}
