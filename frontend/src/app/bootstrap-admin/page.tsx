'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function BootstrapAdminForm() {
  const searchParams = useSearchParams();
  const secretFromUrl = searchParams.get('secret') || '';

  const [secret, setSecret] = useState(secretFromUrl);
  const [email, setEmail] = useState('vibecodingmind@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) {
      setResult({ ok: false, message: 'Add ?secret=YOUR_SEED_SECRET to the URL or enter it below.' });
      return;
    }
    if (!email.trim() || !password) {
      setResult({ ok: false, message: 'Email and password are required.' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${apiBase}/seed/admin?secret=${encodeURIComponent(secret.trim())}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string; error?: string };
      if (res.ok && data.success) {
        setResult({ ok: true, message: data.message || 'Admin created. You can log in now.' });
      } else {
        setResult({ ok: false, message: data.error || data.message || `Request failed: ${res.status}` });
      }
    } catch (err) {
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Cannot reach the server. Set NEXT_PUBLIC_API_URL to your Railway URL and redeploy.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900/95 p-8">
        <h1 className="text-xl font-bold text-white">Create admin account</h1>
        <p className="mt-1 text-sm text-zinc-400">
          One-time setup. Requires SEED_SECRET in Railway. After creating, log in at /login.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300">Secret (from URL or enter)</label>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="busybeds-seed-2024"
              className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300">Admin email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-white"
            />
          </div>
          {result && (
            <div
              className={`rounded-lg p-3 text-sm ${result.ok ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-900/40 text-red-300'}`}
            >
              {result.message}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create admin'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/login" className="text-emerald-400 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function BootstrapAdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-900 flex items-center justify-center text-zinc-400">Loading…</div>}>
      <BootstrapAdminForm />
    </Suspense>
  );
}
