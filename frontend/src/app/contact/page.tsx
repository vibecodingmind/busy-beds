'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { pages, contact as contactApi } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

export default function ContactPage() {
  const toast = useToast();
  const [details, setDetails] = useState<{
    contactEmail: string | null;
    contactPhone: string | null;
    contactAddress: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  useEffect(() => {
    pages
      .getContactDetails()
      .then(setDetails)
      .catch(() => setDetails({ contactEmail: null, contactPhone: null, contactAddress: null }))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast('Please fill in all fields', 'error');
      return;
    }
    setSending(true);
    try {
      await contactApi.submit({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });
      toast('Message sent. We’ll get back to you soon.', 'success');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <p className="text-zinc-500">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-zinc-500 hover:underline mb-6 inline-block">
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold text-black dark:text-white">Contact Us</h1>

        {/* Contact details */}
        <div className="mt-8 rounded-xl border border-zinc-700 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Contact details</h2>
          <ul className="space-y-2 text-zinc-300">
            {details?.contactEmail && (
              <li>
                <span className="text-zinc-500">Email:</span>{' '}
                <a href={`mailto:${details.contactEmail}`} className="text-blue-400 hover:underline">
                  {details.contactEmail}
                </a>
              </li>
            )}
            {details?.contactPhone && (
              <li>
                <span className="text-zinc-500">Phone:</span>{' '}
                <a href={`tel:${details.contactPhone}`} className="text-blue-400 hover:underline">
                  {details.contactPhone}
                </a>
              </li>
            )}
            {details?.contactAddress && (
              <li>
                <span className="text-zinc-500">Address:</span> {details.contactAddress}
              </li>
            )}
            {!details?.contactEmail && !details?.contactPhone && !details?.contactAddress && (
              <li className="text-zinc-500">Contact details can be set in Admin → Pages.</li>
            )}
          </ul>
        </div>

        {/* Contact form */}
        <div className="mt-8 rounded-xl border border-zinc-700 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Send a message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-zinc-400 mb-1">
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-zinc-400 mb-1">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-sm font-medium text-zinc-400 mb-1">
                Message
              </label>
              <textarea
                id="contact-message"
                rows={4}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Your message"
                required
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
