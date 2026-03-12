'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api';

type Entry = {
  id: number;
  admin_user_id: number;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string | null;
  created_at: string;
  admin_email: string | null;
};

export default function AdminAuditLogPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    admin
      .auditLog(100)
      .then((r) => setEntries(r.entries))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user || user.role !== 'admin') return <div className="py-8">Loading...</div>;

  return (
    <div>
      <Link href="/admin" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
        ← Admin
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-black dark:text-zinc-100">Audit log</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Recent admin actions.</p>

      {loading ? (
        <p className="mt-6 text-zinc-500">Loading...</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Admin</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Action</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Entity</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    No entries yet.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300">{e.admin_email ?? e.admin_user_id}</td>
                    <td className="px-4 py-2 text-sm font-mono text-zinc-800 dark:text-zinc-200">{e.action}</td>
                    <td className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300">
                      {e.entity_type}
                      {e.entity_id ? ` #${e.entity_id}` : ''}
                    </td>
                    <td className="max-w-xs truncate px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400" title={e.details ?? undefined}>
                      {e.details ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
