'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { admin } from '@/lib/api';

export default function EditHotelPage() {
  const params = useParams();
  const id = parseInt(params.id as string);
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    contact_phone: '',
    contact_email: '',
    coupon_discount_value: '',
    coupon_limit: 10,
    limit_period: 'daily',
  });
  const [accountForm, setAccountForm] = useState({ email: '', password: '', name: '' });
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
        contact_phone: h.contact_phone || '',
        contact_email: h.contact_email || '',
        coupon_discount_value: h.coupon_discount_value,
        coupon_limit: h.coupon_limit,
        limit_period: h.limit_period,
      });
      setLoaded(true);
    }).catch(() => router.push('/admin/hotels'));
  }, [id, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await admin.hotels.update(id, form);
      router.push('/admin/hotels');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return null;
  if (!loaded) return <div className="py-8">Loading...</div>;

  return (
    <div>
      <Link href="/admin/hotels" className="text-sm text-emerald-600 hover:underline">
        ← Back to hotels
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-zinc-900">Edit Hotel</h1>
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
          <label className="block text-sm font-medium text-zinc-700">Coupon Discount</label>
          <input
            value={form.coupon_discount_value}
            onChange={(e) => setForm((f) => ({ ...f, coupon_discount_value: e.target.value }))}
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
          Save Changes
        </button>
      </form>

      <h2 className="mt-12 text-lg font-semibold text-zinc-900">Create Hotel Account</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Create an account so the hotel can log in and redeem coupons.
      </p>
      <form onSubmit={handleCreateAccount} className="mt-4 max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Name</label>
          <input
            value={accountForm.name}
            onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))}
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Email</label>
          <input
            type="email"
            value={accountForm.email}
            onChange={(e) => setAccountForm((f) => ({ ...f, email: e.target.value }))}
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Password</label>
          <input
            type="password"
            value={accountForm.password}
            onChange={(e) => setAccountForm((f) => ({ ...f, password: e.target.value }))}
            required
            minLength={6}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-6 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          Create Account
        </button>
      </form>
    </div>
  );
}
