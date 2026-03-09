'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useHotelAuth } from '@/contexts/HotelAuthContext';
import { hotelAuth } from '@/lib/api';

export default function HotelRegisterPage() {
  const [hotelId, setHotelId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [hotels, setHotels] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useHotelAuth();
  const router = useRouter();

  useEffect(() => {
    hotelAuth.hotelsWithoutAccount().then((r) => setHotels(r.hotels)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(parseInt(hotelId), email, password, name);
      router.push('/hotel/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-zinc-900">Register Your Hotel</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Select your hotel and create an account to redeem coupons.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        <div>
          <label htmlFor="hotel" className="block text-sm font-medium text-zinc-700">
            Hotel
          </label>
          <select
            id="hotel"
            value={hotelId}
            onChange={(e) => setHotelId(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Select hotel</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          {hotels.length === 0 && (
            <p className="mt-1 text-sm text-zinc-500">
              No hotels available. Contact admin to add your hotel.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
            Your Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || hotels.length === 0}
          className="w-full rounded-lg bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-600">
        Already have an account?{' '}
        <Link href="/hotel/login" className="text-emerald-600 hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
