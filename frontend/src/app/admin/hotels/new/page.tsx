'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { admin } from '@/lib/api';
import PhotosInput from '@/components/admin/PhotosInput';
import LocationFields from '@/components/admin/LocationFields';

export default function NewHotelPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    region: '',
    contact_phone: '',
    contact_email: '',
    contact_whatsapp: '',
    booking_url: '',
    images: [] as string[],
    latitude: '' as string | number,
    longitude: '' as string | number,
    featured: false,
    social_facebook: '',
    social_instagram: '',
    social_x: '',
    social_linkedin: '',
    social_tiktok: '',
    booking_airbnb: '',
    booking_bookingcom: '',
    booking_agoda: '',
    booking_expedia: '',
    coupon_discount_value: '',
    coupon_limit: 10,
    limit_period: 'daily',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await admin.hotels.create({
        ...form,
        images: form.images,
        contact_whatsapp: form.contact_whatsapp || null,
        featured: form.featured,
        latitude: form.latitude === '' ? undefined : Number(form.latitude),
        longitude: form.longitude === '' ? undefined : Number(form.longitude),
        country: 'Tanzania',
        region: form.region || undefined,
        city: undefined,
        social_facebook: form.social_facebook || undefined,
        social_instagram: form.social_instagram || undefined,
        social_x: form.social_x || undefined,
        social_linkedin: form.social_linkedin || undefined,
        social_tiktok: form.social_tiktok || undefined,
        booking_airbnb: form.booking_airbnb || undefined,
        booking_bookingcom: form.booking_bookingcom || undefined,
        booking_agoda: form.booking_agoda || undefined,
        booking_expedia: form.booking_expedia || undefined,
      });
      router.push('/admin/hotels');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create hotel');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  const inputClass = 'mt-1 w-full rounded-lg border border-black/20 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2.5 text-black dark:text-zinc-100 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors';
  const labelClass = 'block text-sm font-medium text-black dark:text-zinc-300';
  const sectionClass = 'rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 space-y-4';

  return (
    <div className="max-w-2xl">
      <Link href="/admin/hotels" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
        ← Back to hotels
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-black dark:text-zinc-100">Add Property</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        {/* Basic Info */}
        <div className={sectionClass}>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Basic Information</p>
          <div>
            <label className={labelClass}>Property Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="e.g. Serengeti Safari Lodge" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe the property, its ambiance, and highlights…" className={inputClass} />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <input type="checkbox" id="featured" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="h-4 w-4 rounded border-black/20 dark:border-zinc-600 accent-emerald-600" />
            <label htmlFor="featured" className="text-sm font-medium text-black dark:text-zinc-300">Featured property (shown prominently in search results)</label>
          </div>
        </div>

        {/* Location */}
        <LocationFields
          value={{ region: form.region, location: form.location }}
          onChange={(v) => setForm((f) => ({ ...f, region: v.region, location: v.location }))}
        />

        {/* Coordinates */}
        <div className={sectionClass}>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">GPS Coordinates <span className="font-normal normal-case text-zinc-400">(optional — enables map & distance features)</span></p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Latitude</label>
              <input type="number" step="any" value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} placeholder="e.g. -3.3869" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Longitude</label>
              <input type="number" step="any" value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} placeholder="e.g. 36.6830" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className={sectionClass}>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Contact Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Phone</label>
              <input value={form.contact_phone} onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))} placeholder="+255 xxx xxx xxx" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.contact_email} onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} placeholder="info@hotel.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>WhatsApp</label>
              <input value={form.contact_whatsapp} onChange={(e) => setForm((f) => ({ ...f, contact_whatsapp: e.target.value }))} placeholder="+255 xxx xxx xxx" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Booking URL</label>
              <input type="url" value={form.booking_url} onChange={(e) => setForm((f) => ({ ...f, booking_url: e.target.value }))} placeholder="https://…" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className={sectionClass}>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Social Media Links <span className="font-normal normal-case text-zinc-400">(optional)</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Facebook URl</label>
              <input type="url" value={form.social_facebook} onChange={(e) => setForm((f) => ({ ...f, social_facebook: e.target.value }))} placeholder="https://facebook.com/…" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Instagram URL</label>
              <input type="url" value={form.social_instagram} onChange={(e) => setForm((f) => ({ ...f, social_instagram: e.target.value }))} placeholder="https://instagram.com/…" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>X (Twitter) URL</label>
              <input type="url" value={form.social_x} onChange={(e) => setForm((f) => ({ ...f, social_x: e.target.value }))} placeholder="https://x.com/…" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>LinkedIn URL</label>
              <input type="url" value={form.social_linkedin} onChange={(e) => setForm((f) => ({ ...f, social_linkedin: e.target.value }))} placeholder="https://linkedin.com/…" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>TikTok URL</label>
              <input type="url" value={form.social_tiktok} onChange={(e) => setForm((f) => ({ ...f, social_tiktok: e.target.value }))} placeholder="https://tiktok.com/…" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Third-Party Booking Links */}
        <div className={sectionClass}>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Third-Party Booking Links <span className="font-normal normal-case text-zinc-400">(optional)</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Airbnb URL</label>
              <input type="url" value={form.booking_airbnb} onChange={(e) => setForm((f) => ({ ...f, booking_airbnb: e.target.value }))} placeholder="https://airbnb.com/…" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Booking.com URL</label>
              <input type="url" value={form.booking_bookingcom} onChange={(e) => setForm((f) => ({ ...f, booking_bookingcom: e.target.value }))} placeholder="https://booking.com/…" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Agoda URL</label>
              <input type="url" value={form.booking_agoda} onChange={(e) => setForm((f) => ({ ...f, booking_agoda: e.target.value }))} placeholder="https://agoda.com/…" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Expedia URL</label>
              <input type="url" value={form.booking_expedia} onChange={(e) => setForm((f) => ({ ...f, booking_expedia: e.target.value }))} placeholder="https://expedia.com/…" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className={sectionClass}>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Photos</p>
          <PhotosInput value={form.images} onChange={(urls) => setForm((f) => ({ ...f, images: urls }))} placeholder="https://images.unsplash.com/photo-…" />
        </div>

        {/* Coupon Settings */}
        <div className={sectionClass}>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Coupon Settings</p>
          <div>
            <label className={labelClass}>Discount Value <span className="text-red-500">*</span></label>
            <input value={form.coupon_discount_value} onChange={(e) => setForm((f) => ({ ...f, coupon_discount_value: e.target.value }))} placeholder="e.g. 15% off or $50 off" required className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Coupon Limit</label>
              <input type="number" min={1} value={form.coupon_limit} onChange={(e) => setForm((f) => ({ ...f, coupon_limit: parseInt(e.target.value) || 0 }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Limit Period</label>
              <select value={form.limit_period} onChange={(e) => setForm((f) => ({ ...f, limit_period: e.target.value }))} className={inputClass}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
          {loading ? 'Creating…' : 'Create Property'}
        </button>
      </form>
    </div>
  );
}
