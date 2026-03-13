'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function StatusPage() {
  const [health, setHealth] = useState<{ status?: string; database?: string; timestamp?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE.replace(/\/api\/v1\/?$/, '')}/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="rounded-2xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-8 max-w-md w-full">
        <h1 className="text-xl font-bold text-black dark:text-zinc-100">System status</h1>
        <p className="mt-1 text-sm text-black dark:text-zinc-400">API and database health.</p>
        {loading ? (
          <p className="mt-6 text-black dark:text-zinc-500">Checking…</p>
        ) : health ? (
          <ul className="mt-6 space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-black dark:text-zinc-400">API</span>
              <span className={health.status === 'ok' ? 'text-emerald-600' : 'text-amber-600'}>{health.status ?? 'unknown'}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-black dark:text-zinc-400">Database</span>
              <span className={health.database === 'ok' ? 'text-emerald-600' : 'text-red-600'}>{health.database ?? 'unknown'}</span>
            </li>
            {health.timestamp && (
              <li className="flex justify-between text-black dark:text-zinc-500">
                <span>Last check</span>
                <span>{new Date(health.timestamp).toLocaleString()}</span>
              </li>
            )}
          </ul>
        ) : (
          <p className="mt-6 text-red-600">Could not reach API.</p>
        )}
        <Link href="/" className="mt-8 inline-block font-medium text-primary hover:underline">Back to home</Link>
      </div>
    </div>
  );
}
