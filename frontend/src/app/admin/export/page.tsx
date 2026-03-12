'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api';

const EXPORTS = [
  { path: '/admin/export/users', filename: 'users.csv', label: 'Users' },
  { path: '/admin/export/coupons', filename: 'coupons.csv', label: 'Coupons' },
  { path: '/admin/export/redemptions', filename: 'redemptions.csv', label: 'Redemptions' },
  { path: '/admin/export/subscriptions', filename: 'subscriptions.csv', label: 'Subscriptions' },
] as const;

export default function AdminExportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExport = async (path: string, filename: string) => {
    setDownloading(path);
    try {
      await admin.exportCsv(path, filename);
    } catch {
      alert('Export failed. Check you are logged in as admin.');
    } finally {
      setDownloading(null);
    }
  };

  if (authLoading || !user || user.role !== 'admin') {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/');
    return <div className="py-8">Loading...</div>;
  }

  return (
    <div>
      <Link href="/admin" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
        ← Admin
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-black dark:text-zinc-100">Export data</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Download CSV files of users, coupons, redemptions, or subscriptions.
      </p>
      <div className="mt-6 flex flex-wrap gap-4">
        {EXPORTS.map(({ path, filename, label }) => (
          <button
            key={path}
            type="button"
            onClick={() => handleExport(path, filename)}
            disabled={downloading !== null}
            className="rounded-lg bg-zinc-800 px-4 py-2 font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-700 dark:hover:bg-zinc-600"
          >
            {downloading === path ? 'Downloading...' : `Export ${label}`}
          </button>
        ))}
      </div>
    </div>
  );
}
