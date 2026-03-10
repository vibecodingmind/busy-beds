'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { referrals } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

export default function ReferralPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<{ code: string; referred: { id: number; name: string; email: string; created_at: string }[] } | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    referrals.me().then(setData).catch(() => {});
  }, [user]);

  const shareUrl = typeof window !== 'undefined' && data ? `${window.location.origin}/register?ref=${data.code}` : '';

  if (authLoading || !user) return <div className="py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Referral Program</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">Share your code. When friends sign up with it, you get credit.</p>

      {data && (
        <div className="mt-8 space-y-8">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Your referral code</h2>
            <p className="mt-2 font-mono text-2xl font-bold text-emerald-600">{data.code}</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Share this link:</p>
            <div className="mt-2 flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <button
                onClick={() => { navigator.clipboard.writeText(shareUrl); toast('Link copied!', 'success'); }}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">People you referred ({data.referred.length})</h2>
            {data.referred.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {data.referred.map((r) => (
                  <li key={r.id} className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                    <span>{r.name} ({r.email})</span>
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-zinc-500 dark:text-zinc-400">No referrals yet. Share your link to get started!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
