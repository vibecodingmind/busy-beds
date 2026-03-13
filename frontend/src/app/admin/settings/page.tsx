'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

type SettingRow = { key: string; label: string; value: string; masked: boolean; group: string };

const GROUP_ORDER = ['Site', 'Stripe', 'PayPal', 'Flutterwave', 'Maps', 'OAuth', 'Business', 'Features', 'WhatsApp', 'Security', 'Operations'];

export default function AdminSettingsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    admin.settings
      .list()
      .then((r) => {
        setSettings(r.settings);
        const initial: Record<string, string> = {};
        r.settings.forEach((s) => {
          initial[s.key] = s.masked ? '' : s.value;
        });
        setDraft(initial);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('expired') || msg.includes('Invalid or expired token')) {
          logout();
          toast('Session expired. Please log in again.', 'error');
          router.push('/login');
          return;
        }
        toast('Failed to load settings', 'error');
      })
      .finally(() => setLoading(false));
  }, [user, toast, logout, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Record<string, string> = {};
      settings.forEach((s) => {
        const v = draft[s.key] ?? '';
        if (s.masked && v === '') return; // leave secret unchanged
        updates[s.key] = v;
      });
      await admin.settings.update(updates);
      toast('Settings saved', 'success');
      const r = await admin.settings.list();
      setSettings(r.settings);
      const nextDraft: Record<string, string> = {};
      r.settings.forEach((s) => {
        nextDraft[s.key] = s.masked ? '' : s.value;
      });
      setDraft(nextDraft);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      if (msg.includes('expired') || msg.includes('Invalid or expired token')) {
        logout();
        toast('Session expired. Please log in again.', 'error');
        router.push('/login');
        return;
      }
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user || user.role !== 'admin') {
    return <div className="py-8 text-black dark:text-zinc-400">Loading...</div>;
  }

  const byGroup = GROUP_ORDER.reduce((acc, g) => {
    acc[g] = settings.filter((s) => s.group === g);
    return acc;
  }, {} as Record<string, SettingRow[]>);

  return (
    <div className="max-w-2xl">
      <Link href="/admin" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
        ← Admin
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-black dark:text-zinc-100">Settings</h1>
      <p className="mt-1 text-sm text-black dark:text-zinc-400">
        API keys and secrets. Values from environment variables override these. Leave secret fields blank to keep current.
      </p>

      {loading ? (
        <p className="mt-6 text-black dark:text-zinc-400">Loading...</p>
      ) : (
        <div className="mt-8 space-y-8">
          {GROUP_ORDER.map((group) => {
            const rows = byGroup[group];
            if (!rows?.length) return null;
            return (
              <div
                key={group}
                className="rounded-xl border border-black/10 dark:border-zinc-700 bg-white p-6 dark:bg-zinc-900"
              >
                <h2 className="font-semibold text-black dark:text-zinc-100">{group}</h2>
                <div className="mt-4 space-y-4">
                  {rows.map((s) => (
                    <div key={s.key}>
                      <label className="block text-sm font-medium text-black dark:text-zinc-300">
                        {s.label}
                      </label>
                      {s.masked && s.value && (
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                          Current: {s.value}
                        </p>
                      )}
                      <input
                        type={s.masked ? 'password' : 'text'}
                        placeholder={s.masked ? 'New value (leave blank to keep)' : ''}
                        value={draft[s.key] ?? ''}
                        onChange={(e) => setDraft((prev) => ({ ...prev, [s.key]: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-black/20 bg-white px-4 py-2 text-black dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                        autoComplete="off"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            {saving ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      )}
    </div>
  );
}
