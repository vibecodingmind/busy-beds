'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api';

type PendingAccount = {
  id: number;
  hotel_id: number;
  email: string;
  name: string;
  hotel_name: string;
  created_at: string;
};

export default function AdminHotelAccountsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<PendingAccount[]>([]);
  const [approving, setApproving] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    admin.pendingHotelAccounts().then((r) => setAccounts(r.accounts)).catch(() => {});
  }, [user]);

  const handleApprove = async (id: number) => {
    setApproving(id);
    try {
      await admin.approveHotelAccount(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // ignore
    } finally {
      setApproving(null);
    }
  };

  if (authLoading || !user || user.role !== 'admin') return <div className="py-8">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-black hover:text-black">
          ← Admin
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-black">Pending Hotel Approvals</h1>
      <p className="mt-2 text-sm text-black">
        Hotel owners who registered must be approved before they can log in.
      </p>
      {accounts.length === 0 ? (
        <div className="mt-8 rounded-lg border border-black/10 dark:border-zinc-700 bg-white p-8 text-center text-black">
          No pending approvals.
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border border-black/10 dark:border-zinc-700">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-white dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-black">Hotel</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-black">Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-black">Email</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-black">Submitted</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-black">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2 font-medium">{a.hotel_name}</td>
                  <td className="px-4 py-2">{a.name}</td>
                  <td className="px-4 py-2 text-sm">{a.email}</td>
                  <td className="px-4 py-2 text-sm text-black">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleApprove(a.id)}
                      disabled={approving === a.id}
                      className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {approving === a.id ? 'Approving...' : 'Approve'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
