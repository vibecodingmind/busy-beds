'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

export default function AdminExchangeRatesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const toast = useToast();
    const [rates, setRates] = useState<{ id: number; currency_code: string; rate: number; updated_at: string }[]>([]);
    const [form, setForm] = useState({ currency_code: '', rate: 1.0 });

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) router.push('/');
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user || user.role !== 'admin') return;
        admin.exchangeRates.list().then((r) => setRates(r.rates)).catch(() => { });
    }, [user]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!form.currency_code || form.currency_code.length !== 3) {
                toast('Invalid currency code (needs 3 letters)', 'error');
                return;
            }
            await admin.exchangeRates.update(form.currency_code.toUpperCase(), form.rate);
            setForm({ currency_code: '', rate: 1.0 });
            toast('Exchange rate updated', 'success');
            admin.exchangeRates.list().then((r) => setRates(r.rates)).catch(() => { });
        } catch {
            toast('Failed to update rate', 'error');
        }
    };

    const handleDelete = async (code: string) => {
        if (!confirm(`Delete ${code} rate?`)) return;
        try {
            await admin.exchangeRates.delete(code);
            toast('Rate deleted', 'success');
            setRates((prev) => prev.filter((r) => r.currency_code !== code));
        } catch {
            toast('Failed to delete', 'error');
        }
    };

    if (authLoading || !user || user.role !== 'admin') return <div className="py-8">Loading...</div>;

    return (
        <div className="p-6">
            <Link href="/admin" className="text-sm text-emerald-600 hover:underline">← Admin</Link>
            <h1 className="mt-6 text-2xl font-bold text-black dark:text-zinc-100">Exchange Rates (Relative to USD)</h1>
            <p className="mt-2 text-sm text-zinc-500">Define how much of the target currency equals 1 USD. E.g. 1 USD = 2600 TZS.</p>

            <form onSubmit={handleUpdate} className="mt-8 max-w-sm space-y-4 rounded-xl border border-black/10 dark:border-zinc-700 bg-white p-6 dark:bg-zinc-900">
                <div>
                    <label className="mb-1 block text-sm font-medium text-black dark:text-zinc-300">Currency Code</label>
                    <input
                        placeholder="e.g. TZS"
                        value={form.currency_code}
                        onChange={(e) => setForm((f) => ({ ...f, currency_code: e.target.value }))}
                        required
                        maxLength={3}
                        className="w-full rounded-lg border border-black/20 dark:border-zinc-600 px-4 py-2 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-black dark:text-zinc-300">Rate (1 USD = X)</label>
                    <input
                        type="number"
                        step="0.000001"
                        value={form.rate}
                        onChange={(e) => setForm((f) => ({ ...f, rate: parseFloat(e.target.value) || 0 }))}
                        required
                        className="w-full rounded-lg border border-black/20 dark:border-zinc-600 px-4 py-2 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                </div>
                <button type="submit" className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700">
                    Save Rate
                </button>
            </form>

            <div className="mt-12 overflow-hidden rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                <table className="min-w-full divide-y divide-black/10 dark:divide-zinc-700">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Currency</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Rate (to 1 USD)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Last Updated</th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Actions</th>
                        </tr>
                    </thead>
                    <body className="divide-y divide-black/10 dark:divide-zinc-700 bg-white dark:bg-zinc-900">
                        {rates.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-sm text-zinc-500">No custom rates defined. Defaults to USD only.</td>
                            </tr>
                        )}
                        {rates.map((r) => (
                            <tr key={r.id}>
                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-black dark:text-zinc-100">{r.currency_code}</td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{r.rate}</td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{new Date(r.updated_at).toLocaleString()}</td>
                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                    <button onClick={() => handleDelete(r.currency_code)} className="text-red-600 hover:text-red-900 dark:text-red-400">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </body>
                </table>
            </div>
        </div>
    );
}
