'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api';

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<{ id: number; email: string; name: string; role: string }[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    admin.users().then((r) => setUsers(r.users)).catch(() => {});
  }, [user]);

  if (authLoading || !user || user.role !== 'admin') return <div className="py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Users</h1>
      <div className="mt-8 overflow-x-auto rounded-lg border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-zinc-900">ID</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-zinc-900">Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-zinc-900">Email</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-zinc-900">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2 text-sm">{u.id}</td>
                <td className="px-4 py-2 font-medium">{u.name}</td>
                <td className="px-4 py-2 text-sm">{u.email}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
