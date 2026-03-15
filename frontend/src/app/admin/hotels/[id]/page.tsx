'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { admin } from '@/lib/api';
import type { ManagingAccount, MediaItem } from '@/lib/api';
import PhotosInput from '@/components/admin/PhotosInput';
import HotelRoomsManager from '@/components/admin/HotelRoomsManager';
import LocationFields from '@/components/admin/LocationFields';
import PropertyAmenitiesManager from '@/components/admin/PropertyAmenitiesManager';

function isMediaItemArray(arr: string[] | MediaItem[]): arr is MediaItem[] {
  return arr.length > 0 && typeof arr[0] === 'object' && 'url' in arr[0];
}

function toStringArray(images: string[] | MediaItem[]): string[] {
  if (isMediaItemArray(images)) {
    return images.map(item => item.url);
  }
  return images;
}

export default function EditHotelPage() {
  const params = useParams();
  const id = parseInt(params.id as string);
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
    active: true,
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
  const [accountForm, setAccountForm] = useState({ email: '', password: '', name: '' });
  const [managingAccount, setManagingAccount] = useState<ManagingAccount | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    admin.hotels.get(id).then((h) => {
      setForm({
        name: h.name,
        description: h.description || '',
        location: h.location || '',
        region: (h as any).region || '',
        contact_phone: h.contact_phone || '',
        contact_email: h.contact_email || '',
        contact_whatsapp: h.contact_whatsapp || '',
        images: toStringArray(h.images || []),
        booking_url: h.booking_url || '',
        latitude: h.latitude ?? '',
        longitude: h.longitude ?? '',
        featured: h.featured ?? false,
        active: h.active !== false,
        social_facebook: h.social_facebook || '',
        social_instagram: h.social_instagram || '',
        social_x: h.social_x || '',
        social_linkedin: h.social_linkedin || '',
        social_tiktok: h.social_tiktok || '',
        booking_airbnb: h.booking_airbnb || '',
        booking_bookingcom: h.booking_bookingcom || '',
        booking_agoda: h.booking_agoda || '',
        booking_expedia: h.booking_expedia || '',
        coupon_discount_value: h.coupon_discount_value,
        coupon_limit: h.coupon_limit,
        limit_period: h.limit_period,
      });
      setManagingAccount(h.managing_account ?? null);
      setLoaded(true);
    }).catch(() => router.push('/admin/hotels'));
  }, [id, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await admin.hotels.update(id, {
        ...form,
        images: form.images,
        contact_whatsapp: form.contact_whatsapp || null,
        featured: form.featured,
        active: form.active,
        booking_url: form.booking_url || null,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        country: 'Tanzania',
        region: (form.region || null) as any,
        city: null,
        social_facebook: form.social_facebook || null,
        social_instagram: form.social_instagram || null,
        social_x: form.social_x || null,
        social_linkedin: form.social_linkedin || null,
        social_tiktok: form.social_tiktok || null,
        booking_airbnb: form.booking_airbnb || null,
        booking_bookingcom: form.booking_bookingcom || null,
        booking_agoda: form.booking_agoda || null,
        booking_expedia: form.booking_expedia || null,
      });
      router.push('/admin/hotels');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this property? This cannot be undone.')) return;
    setLoading(true);
    try {
      await admin.hotels.delete(id);
      router.push('/admin/hotels');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await admin.hotels.createAccount(id, accountForm.email, accountForm.password, accountForm.name);
      setAccountForm({ email: '', password: '', name: '' });
      const h = await admin.hotels.get(id);
      setManagingAccount(h.managing_account ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return null;
  if (!loaded) return <div className="py-8 text-zinc-500">Loading…</div>;

  const inputClass = 'mt-1 w-full rounded-lg border border-black/20 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2.5 text-black dark:text-zinc-100 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors';
  const labelClass = 'block text-sm font-medium text-black dark:text-zinc-300';
  const sectionClass = 'rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 space-y-4';

  return (
    <div className="max-w-2xl">
      <Link href="/admin/hotels" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
        ← Back to hotels
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-black dark:text-zinc-100">Edit Property</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        {/* Basic Info */}
        <div className={sectionClass}>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Basic Information</p>
          <div>
            <label className={labelClass}>Property Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} className={inputClass} />
          </div>
          <div className="flex flex-col gap-3 pt-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" id="featured" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="h-4 w-4 rounded border-black/20 dark:border-zinc-600 accent-emerald-600" />
              <span className="text-sm font-medium text-black dark:text-zinc-300">Featured property (shown prominently)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" id="active" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="h-4 w-4 rounded border-black/20 dark:border-zinc-600 accent-emerald-600" />
              <span className="text-sm font-medium text-black dark:text-zinc-300">Active (visible on site)</span>
            </label>
          </div>
        </div>

        {/* Location */}
        <LocationFields
          value={{ region: form.region, location: form.location }}
          onChange={(v) => setForm((f) => ({ ...f, region: v.region, location: v.location }))}
        />

        {/* Coordinates */}
        <div className={sectionClass}>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">GPS Coordinates</p>
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
              <input value={form.contact_phone} onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.contact_email} onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} className={inputClass} />
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
            <input value={form.coupon_discount_value} onChange={(e) => setForm((f) => ({ ...f, coupon_discount_value: e.target.value }))} required className={inputClass} />
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

        <div className="flex items-center gap-4">
          <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {loading ? 'Saving…' : 'Save Property'}
          </button>
          <button type="button" onClick={handleDelete} disabled={loading} className="rounded-xl border border-red-500 px-6 py-3 font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 disabled:opacity-50 transition-colors">
            Delete
          </button>
        </div>
      </form>

      {/* Rooms Manager */}
      <div className="mt-10">
        <HotelRoomsManager hotelId={id} />
      </div>

      {/* Amenities Manager */}
      <div className="mt-10">
        <PropertyAmenitiesManager hotelId={id} />
      </div>

      {/* Hotel account */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-100">Hotel Login Account</h2>
        {managingAccount ? (
          <div className="mt-4 rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 max-w-lg">
            <p className="text-sm font-medium text-black dark:text-zinc-300">Managing account</p>
            <p className="mt-1 text-black dark:text-zinc-200 font-medium">{managingAccount.name}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{managingAccount.email}</p>
            <p className="mt-2">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${managingAccount.approved ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'}`}>
                {managingAccount.approved ? 'Approved' : 'Pending approval'}
              </span>
            </p>
            {!managingAccount.approved && (
              <Link href="/admin/hotel-accounts" className="mt-2 inline-block text-sm text-emerald-600 hover:underline dark:text-emerald-400">
                Approve in Pending Hotel Approvals →
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Create an account so the hotel can log in and redeem coupons.
            </p>
            <form onSubmit={handleCreateAccount} className="mt-4 max-w-lg space-y-4 rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
              <div>
                <label className={labelClass}>Name</label>
                <input value={accountForm.name} onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))} required className="mt-1 w-full rounded-lg border border-black/20 dark:border-zinc-600 px-4 py-2 dark:bg-zinc-800 dark:text-zinc-100 outline-none" />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={accountForm.email} onChange={(e) => setAccountForm((f) => ({ ...f, email: e.target.value }))} required className="mt-1 w-full rounded-lg border border-black/20 dark:border-zinc-600 px-4 py-2 dark:bg-zinc-800 dark:text-zinc-100 outline-none" />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input type="password" value={accountForm.password} onChange={(e) => setAccountForm((f) => ({ ...f, password: e.target.value }))} required minLength={6} className="mt-1 w-full rounded-lg border border-black/20 dark:border-zinc-600 px-4 py-2 dark:bg-zinc-800 dark:text-zinc-100 outline-none" />
              </div>
              <button type="submit" disabled={loading} className="rounded-lg bg-zinc-900 px-6 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                Create Account
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
