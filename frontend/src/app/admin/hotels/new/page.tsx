'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { admin } from '@/lib/api';
import PhotosInput from '@/components/admin/PhotosInput';

export default function NewHotelPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    contact_phone: '',
    contact_email: '',
    contact_whatsapp: '',
    booking_url: '',
    images: [] as string[],
    latitude: '' as string | number,
    longitude: '' as string | number,
    featured: false,
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
      });
      router.push('/admin/hotels');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create hotel');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div>
      <Link href="/admin/hotels" className="text-sm text-emerald-600 hover:underline">
        ← Back to hotels
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-zinc-900">Add Hotel</h1>
      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-zinc-700">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Location</label>
          <input
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Contact Email</label>
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Booking URL</label>
          <input
            type="url"
            value={form.booking_url}
            onChange={(e) => setForm((f) => ({ ...f, booking_url: e.target.value }))}
            placeholder="https://example.com/book"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Contact Phone</label>
          <input
            value={form.contact_phone}
            onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">WhatsApp (optional)</label>
          <input
            value={form.contact_whatsapp}
            onChange={(e) => setForm((f) => ({ ...f, contact_whatsapp: e.target.value }))}
            placeholder="e.g. +1234567890"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="featured"
            checked={form.featured}
            onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
            className="h-4 w-4 rounded border-zinc-300"
          />
          <label htmlFor="featured" className="text-sm font-medium text-zinc-700">Featured hotel</label>
        </div>
        <PhotosInput
          value={form.images}
          onChange={(urls) => setForm((f) => ({ ...f, images: urls }))}
          placeholder="https://images.unsplash.com/photo-..."
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Latitude</label>
            <input
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
              placeholder="e.g. 37.7749"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Longitude</label>
            <input
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
              placeholder="e.g. -122.4194"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Coupon Discount</label>
          <input
            value={form.coupon_discount_value}
            onChange={(e) => setForm((f) => ({ ...f, coupon_discount_value: e.target.value }))}
            placeholder="e.g. 15% off or $50 off"
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Coupon Limit</label>
          <input
            type="number"
            min={1}
            value={form.coupon_limit}
            onChange={(e) => setForm((f) => ({ ...f, coupon_limit: parseInt(e.target.value) || 0 }))}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Limit Period</label>
          <select
            value={form.limit_period}
            onChange={(e) => setForm((f) => ({ ...f, limit_period: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Hotel'}
        </button>
      </form>
    </div>
  );
}
