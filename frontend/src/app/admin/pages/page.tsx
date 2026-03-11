'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

type PageContent = {
  page_privacy: string;
  page_terms: string;
  page_about: string;
  contact_phone: string;
  contact_address: string;
};

const TABS = [
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'terms', label: 'Terms of Service' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact details' },
] as const;

export default function AdminPagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<PageContent | null>(null);
  const [draft, setDraft] = useState<PageContent>({
    page_privacy: '',
    page_terms: '',
    page_about: '',
    contact_phone: '',
    contact_address: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('privacy');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    admin.pages
      .get()
      .then((res) => {
        setData(res);
        setDraft({
          page_privacy: res.page_privacy ?? '',
          page_terms: res.page_terms ?? '',
          page_about: res.page_about ?? '',
          contact_phone: res.contact_phone ?? '',
          contact_address: res.contact_address ?? '',
        });
      })
      .catch(() => toast('Failed to load pages', 'error'))
      .finally(() => setLoading(false));
  }, [user, toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await admin.pages.update(draft);
      toast('Pages saved', 'success');
      setData({ ...draft });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user || user.role !== 'admin') {
    return <div className="py-8 text-zinc-400">Loading...</div>;
  }

  return (
    <div className="max-w-4xl">
      <Link href="/admin" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
        ← Admin
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-black dark:text-zinc-100">Pages</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Edit Privacy Policy, Terms of Service, About, and Contact details. Use simple HTML for headings and links (e.g. &lt;p&gt;, &lt;h2&gt;, &lt;a&gt;). Contact email is set in Settings → Support email.
      </p>

      {loading ? (
        <p className="mt-6 text-zinc-500">Loading...</p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2 border-b border-zinc-700 pb-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-zinc-700 bg-zinc-900/50 p-6">
            {activeTab === 'privacy' && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Privacy Policy (HTML)</label>
                <textarea
                  value={draft.page_privacy}
                  onChange={(e) => setDraft((d) => ({ ...d, page_privacy: e.target.value }))}
                  rows={14}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="<h2>Privacy Policy</h2><p>Your content here...</p>"
                />
              </div>
            )}
            {activeTab === 'terms' && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Terms of Service (HTML)</label>
                <textarea
                  value={draft.page_terms}
                  onChange={(e) => setDraft((d) => ({ ...d, page_terms: e.target.value }))}
                  rows={14}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="<h2>Terms of Service</h2><p>Your content here...</p>"
                />
              </div>
            )}
            {activeTab === 'about' && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">About (HTML)</label>
                <textarea
                  value={draft.page_about}
                  onChange={(e) => setDraft((d) => ({ ...d, page_about: e.target.value }))}
                  rows={14}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="<h2>About Us</h2><p>Your content here...</p>"
                />
              </div>
            )}
            {activeTab === 'contact' && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-500">
                  Contact email is configured in Admin → Settings (Support / contact email). Here you can set phone and address shown on the Contact page.
                </p>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={draft.contact_phone}
                    onChange={(e) => setDraft((d) => ({ ...d, contact_phone: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Address</label>
                  <textarea
                    value={draft.contact_address}
                    onChange={(e) => setDraft((d) => ({ ...d, contact_address: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="123 Main St, City, Country"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save all pages'}
          </button>
        </>
      )}
    </div>
  );
}
