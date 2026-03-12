'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api';

type Submission = {
  id: number;
  name: string;
  email: string;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

export default function AdminContactInboxPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, authLoading, router]);

  const fetchSubmissions = () => {
    if (!user || user.role !== 'admin') return;
    admin.contactSubmissions
      .list()
      .then((r) => setSubmissions(r.submissions))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubmissions();
  }, [user]);

  const handleUpdate = async (s: Submission) => {
    if (editingId !== s.id) {
      setEditingId(s.id);
      setNotes(s.admin_notes || '');
      setStatus(s.status);
      return;
    }
    setLoading(true);
    try {
      await admin.contactSubmissions.update(s.id, { status: status || undefined, admin_notes: notes });
      setSubmissions((prev) =>
        prev.map((x) => (x.id === s.id ? { ...x, status, admin_notes: notes || null } : x))
      );
      setEditingId(null);
    } catch {
      alert('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user || user.role !== 'admin') return <div className="py-8">Loading...</div>;

  return (
    <div>
      <Link href="/admin" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
        ← Admin
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-black dark:text-zinc-100">Contact form inbox</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        View and update status/notes for contact form submissions.
      </p>

      {loading && submissions.length === 0 ? (
        <p className="mt-6 text-zinc-500">Loading...</p>
      ) : (
        <div className="mt-6 space-y-4">
          {submissions.length === 0 ? (
            <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
              No submissions yet.
            </p>
          ) : (
            submissions.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-black dark:text-zinc-100">{s.name}</p>
                    <a href={`mailto:${s.email}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                      {s.email}
                    </a>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{s.message}</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                      {new Date(s.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.status === 'new'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                        : s.status === 'replied'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                          : s.status === 'archived'
                            ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-600 dark:text-zinc-200'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                {editingId === s.id ? (
                  <div className="mt-4 space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="replied">Replied</option>
                      <option value="archived">Archived</option>
                    </select>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Admin notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                      placeholder="Internal notes..."
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdate(s)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600 dark:text-zinc-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
                    {s.admin_notes && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        <span className="font-medium">Notes:</span> {s.admin_notes}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => handleUpdate(s)}
                      className="text-sm text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      {editingId === s.id ? 'Save' : 'Edit status / notes'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
