'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { formatPlanPrice } from '@/lib/formatPlanPrice';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'TZS'] as const;

export default function AdminPlansPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [plans, setPlans] = useState<
    { id: number; name: string; monthly_coupon_limit: number; price: number; currency?: string; interval: 'week' | 'month' | 'year'; stripe_price_id: string | null; paypal_plan_id: string | null; flutterwave_plan_id: string | null }[]
  >([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({ name: '', monthly_coupon_limit: 5, price: 0, currency: 'USD' as string, interval: 'month' as 'week' | 'month' | 'year', stripe_price_id: '', paypal_plan_id: '', flutterwave_plan_id: '' });
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', monthly_coupon_limit: 5, price: 0, currency: 'USD' as string, interval: 'month' as 'week' | 'month' | 'year', stripe_price_id: '', paypal_plan_id: '', flutterwave_plan_id: '' });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    admin.plans.list().then((r) => setPlans(r.plans)).catch(() => { });
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await admin.plans.create({
        name: form.name,
        monthly_coupon_limit: form.monthly_coupon_limit,
        price: form.price,
        currency: form.currency || 'USD',
        interval: form.interval,
        stripe_price_id: form.stripe_price_id || undefined,
        paypal_plan_id: form.paypal_plan_id || undefined,
        flutterwave_plan_id: form.flutterwave_plan_id || undefined,
      });
      setForm({ name: '', monthly_coupon_limit: 5, price: 0, currency: 'USD', interval: 'month', stripe_price_id: '', paypal_plan_id: '', flutterwave_plan_id: '' });
      toast('Plan created', 'success');
      admin.plans.list().then((r) => setPlans(r.plans)).catch(() => { });
    } catch {
      toast('Failed to create plan', 'error');
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      await admin.plans.update(id, {
        name: editForm.name,
        monthly_coupon_limit: editForm.monthly_coupon_limit,
        price: editForm.price,
        currency: editForm.currency || 'USD',
        interval: editForm.interval,
        stripe_price_id: editForm.stripe_price_id || undefined,
        paypal_plan_id: editForm.paypal_plan_id || undefined,
        flutterwave_plan_id: editForm.flutterwave_plan_id || undefined,
      });
      setEditing(null);
      toast('Plan updated', 'success');
      admin.plans.list().then((r) => setPlans(r.plans)).catch(() => { });
    } catch {
      toast('Failed to update', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this plan? Existing subscriptions may be affected.')) return;
    try {
      await admin.plans.delete(id);
      toast('Plan deleted', 'success');
      setPlans((p) => p.filter((x) => x.id !== id));
    } catch {
      toast('Failed to delete (plan may be in use)', 'error');
    }
  };

  if (authLoading || !user || user.role !== 'admin') return <div className="py-8">Loading...</div>;

  return (
    <div>
      <Link href="/admin" className="text-sm text-emerald-600 hover:underline">← Admin</Link>
      <h1 className="mt-6 text-2xl font-bold text-black dark:text-zinc-100">Subscription Plans</h1>

      <form onSubmit={handleCreate} className="mt-8 max-w-md space-y-4 rounded-xl border border-black/10 dark:border-zinc-700 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="font-semibold text-black dark:text-zinc-100">Add Plan</h2>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          className="w-full rounded-lg border border-black/20 dark:border-zinc-600 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <input
          type="number"
          min={1}
          placeholder="Coupons/month"
          value={form.monthly_coupon_limit}
          onChange={(e) => setForm((f) => ({ ...f, monthly_coupon_limit: parseInt(e.target.value) || 0 }))}
          className="w-full rounded-lg border border-black/20 dark:border-zinc-600 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <input
          type="number"
          step="0.01"
          min={0}
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
          className="w-full rounded-lg border border-black/20 dark:border-zinc-600 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-black dark:text-zinc-300">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              className="w-full rounded-lg border border-black/20 dark:border-zinc-600 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-black dark:text-zinc-300">Interval</label>
            <select
              value={form.interval}
              onChange={(e) => setForm((f) => ({ ...f, interval: e.target.value as any }))}
              className="w-full rounded-lg border border-black/20 dark:border-zinc-600 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
        </div>

        <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs text-emerald-600 hover:underline">
          {showAdvanced ? 'Hide Advanced (Gateway IDs)' : 'Show Advanced (Gateway IDs)'}
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t border-black/5 dark:border-zinc-700">
            <input
              placeholder="Stripe Price ID (Legacy)"
              value={form.stripe_price_id}
              onChange={(e) => setForm((f) => ({ ...f, stripe_price_id: e.target.value }))}
              className="w-full rounded-lg border border-black/20 dark:border-zinc-600 px-4 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <input
              placeholder="PayPal Plan ID (Legacy)"
              value={form.paypal_plan_id}
              onChange={(e) => setForm((f) => ({ ...f, paypal_plan_id: e.target.value }))}
              className="w-full rounded-lg border border-black/20 dark:border-zinc-600 px-4 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <input
              placeholder="Flutterwave Plan ID (Legacy)"
              value={form.flutterwave_plan_id}
              onChange={(e) => setForm((f) => ({ ...f, flutterwave_plan_id: e.target.value }))}
              className="w-full rounded-lg border border-black/20 dark:border-zinc-600 px-4 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        )}
        <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">Create</button>
      </form>

      <div className="mt-8 space-y-4">
        {plans.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-black/10 dark:border-zinc-700 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            {editing === p.id ? (
              <>
                <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="rounded border px-2 py-1 dark:bg-zinc-800 dark:text-zinc-100" />
                <input type="number" min={1} value={editForm.monthly_coupon_limit} onChange={(e) => setEditForm((f) => ({ ...f, monthly_coupon_limit: parseInt(e.target.value) || 0 }))} className="w-20 rounded border px-2 py-1 dark:bg-zinc-800 dark:text-zinc-100" />
                <input type="number" step="0.01" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))} className="w-20 rounded border px-2 py-1 dark:bg-zinc-800 dark:text-zinc-100" />
                <select value={editForm.currency} onChange={(e) => setEditForm((f) => ({ ...f, currency: e.target.value }))} className="rounded border px-2 py-1 text-sm dark:bg-zinc-800 dark:text-zinc-100">
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select value={editForm.interval} onChange={(e) => setEditForm((f) => ({ ...f, interval: e.target.value as any }))} className="rounded border px-2 py-1 text-sm dark:bg-zinc-800 dark:text-zinc-100">
                  <option value="week">week</option>
                  <option value="month">month</option>
                  <option value="year">year</option>
                </select>
                {/* Advanced hidden in edit for simplicity, can be added if needed */}
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(p.id)} className="rounded bg-emerald-600 px-2 py-1 text-sm text-white">Save</button>
                  <button onClick={() => setEditing(null)} className="rounded bg-black/10 dark:bg-zinc-600 px-2 py-1 text-sm dark:bg-zinc-600">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <span className="font-medium text-black dark:text-zinc-100">{p.name}</span>
                <span className="text-black dark:text-zinc-400">{p.monthly_coupon_limit} coupons/{p.interval || 'mo'} · {formatPlanPrice(p.price, p.currency)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(p.id);
                      setEditForm({
                        name: p.name,
                        monthly_coupon_limit: p.monthly_coupon_limit,
                        price: p.price,
                        currency: p.currency || 'USD',
                        interval: p.interval || 'month',
                        stripe_price_id: p.stripe_price_id || '',
                        paypal_plan_id: p.paypal_plan_id || '',
                        flutterwave_plan_id: p.flutterwave_plan_id || '',
                      });
                    }}
                    className="rounded bg-zinc-200 px-2 py-1 text-sm dark:bg-zinc-600"
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="rounded bg-red-100 px-2 py-1 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
