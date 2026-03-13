'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { admin, type User } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState<(User & { active?: boolean })[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    admin.users().then((r) => setUsers(r.users)).catch(() => {});
  }, [user]);

  const refreshUsers = () => {
    admin.users().then((r) => setUsers(r.users)).catch(() => {});
  };

  const handleDelete = async (u: User & { active?: boolean }) => {
    if (u.role === 'admin') return;
    if (!confirm(`Delete user "${u.name}" (${u.email})? This cannot be undone.`)) return;
    setLoading((p) => ({ ...p, [`del-${u.id}`]: true }));
    try {
      await admin.userDelete(u.id);
      toast('User deleted', 'success');
      refreshUsers();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete user', 'error');
    } finally {
      setLoading((p) => ({ ...p, [`del-${u.id}`]: false }));
    }
  };

  const handleToggleActive = async (u: User & { active?: boolean }) => {
    if (u.role === 'admin') return;
    const newActive = !(u.active !== false);
    setLoading((p) => ({ ...p, [`act-${u.id}`]: true }));
    try {
      await admin.userUpdateActive(u.id, newActive);
      toast(newActive ? 'User activated' : 'User deactivated', 'success');
      refreshUsers();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update user', 'error');
    } finally {
      setLoading((p) => ({ ...p, [`act-${u.id}`]: false }));
    }
  };

  if (authLoading || !user || user.role !== 'admin') {
    return <div className="py-12 text-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="mt-1 text-muted">Manage user accounts. Admins cannot be deleted or deactivated.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr className="bg-muted/30">
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Role</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Joined</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{u.id}</td>
                <td className="px-4 py-3 text-sm text-foreground">{u.name}</td>
                <td className="px-4 py-3 text-sm text-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.role === 'admin'
                        ? 'bg-amber-200 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200'
                        : 'bg-primary/15 text-primary dark:bg-primary/25'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.active !== false
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                    }`}
                  >
                    {u.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(u)}
                      disabled={u.role === 'admin' || loading[`act-${u.id}`]}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading[`act-${u.id}`] ? '...' : u.active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={u.role === 'admin' || loading[`del-${u.id}`]}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50"
                    >
                      {loading[`del-${u.id}`] ? '...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
