'use client';

import { useState } from 'react';
import { waitlist } from '@/lib/api';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setMessage('');
    try {
      const res = await waitlist.join(email.trim());
      setStatus('success');
      setMessage(res.message);
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  return (
    <section className="mt-12 rounded-2xl border border-zinc-200 bg-white px-8 py-10 dark:border-zinc-700 dark:bg-zinc-900/50">
      <h2 className="text-xl font-semibold text-black dark:text-zinc-100">New hotels coming soon</h2>
      <p className="mt-2 text-black dark:text-zinc-400">Get notified when we add new partner hotels.</p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={status === 'loading'}
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-lg bg-zinc-900 px-6 py-2.5 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
        >
          {status === 'loading' ? 'Joining...' : 'Notify me'}
        </button>
      </form>
      {status === 'success' && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
      {status === 'error' && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{message}</p>}
    </section>
  );
}
