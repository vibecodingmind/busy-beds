'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { coupons } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Ticket, CheckCircle2, History, XCircle } from 'lucide-react';

type Coupon = { id: number; code: string; hotel_name: string; discount_value: string; status: string; expires_at: string; remind_1_day_before?: boolean };

function getExpiryCountdown(expiresAt: string): string {
  const exp = new Date(expiresAt);
  const now = new Date();
  if (exp <= now) return 'Expired';
  const ms = exp.getTime() - now.getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 7) return `Expires in ${days} days`;
  if (days > 0) return `Expires in ${days}d ${hours}h`;
  if (hours > 0) return `Expires in ${hours} hours`;
  return 'Expires soon';
}

const DEFAULT_TERMS = [
  'Redeemable at the hotel at check-in',
  'Can be used for eligible room rates only',
  'Cannot be reactivated after expiry',
  'Limit to one-time usage per coupon',
];

export default function MyCouponsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [couponList, setCouponList] = useState<Coupon[]>([]);
  const [selected, setSelected] = useState<Coupon | null>(null);
  const [tab, setTab] = useState<'active' | 'used' | 'expired'>('active');
  const [remindLoading, setRemindLoading] = useState(false);

  const filteredCoupons = couponList.filter((c) => {
    if (tab === 'active') return c.status === 'active';
    if (tab === 'used') return c.status === 'redeemed';
    if (tab === 'expired') return c.status === 'expired' || c.status === 'cancelled';
    return true;
  });

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    coupons.list().then((r) => setCouponList(r.coupons)).catch(() => { });
  }, [user]);

  const handleCancel = async (couponId: number) => {
    if (!confirm('Cancel this coupon? It cannot be used after cancellation.')) return;
    try {
      await coupons.cancel(couponId);
      setCouponList((prev) => prev.map((c) => (c.id === couponId ? { ...c, status: 'cancelled' } : c)));
      if (selected?.id === couponId) setSelected(null);
    } catch {
      // ignore
    }
  };

  const handleRemindToggle = async (couponId: number, value: boolean) => {
    setRemindLoading(true);
    try {
      await coupons.setReminder(couponId, value);
      setCouponList((prev) => prev.map((c) => (c.id === couponId ? { ...c, remind_1_day_before: value } : c)));
      if (selected?.id === couponId) setSelected({ ...selected, remind_1_day_before: value });
    } catch {
      // ignore
    } finally {
      setRemindLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (authLoading || !user) return <div className="py-12 text-black dark:text-zinc-400">Loading...</div>;

  return (
    <div className="space-y-6 print:space-y-0 print:m-0 print:p-0">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-black dark:text-zinc-100">My Coupons</h1>
        <p className="mt-1 text-black dark:text-zinc-400">Select a coupon to view details and QR code.</p>
      </div>

      <div className="flex gap-2 border-b border-black/10 dark:border-zinc-700 print:hidden">
        {(['active', 'used', 'expired'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${tab === t
                ? 'border-emerald-500 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-black dark:text-zinc-400 dark:hover:text-zinc-300'
              }`}
          >
            {t === 'active' && 'Active'}
            {t === 'used' && 'Used'}
            {t === 'expired' && 'Expired'}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-stretch print:mt-0 print:block">
        {/* Left: Coupon list */}
        <div className="flex flex-1 flex-col gap-4 lg:max-w-md print:hidden">
          {filteredCoupons.map((c) => (
            <div
              key={c.id}
              className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 bg-white p-4 transition dark:bg-zinc-900 ${selected?.id === c.id
                  ? 'border-emerald-500 shadow-md dark:border-emerald-600'
                  : 'border-black/10 dark:border-zinc-700 hover:border-black/20 dark:hover:border-zinc-600 dark:border-zinc-700 dark:hover:border-zinc-600'
                }`}
              onClick={() => setSelected(c)}
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-zinc-700 text-xl font-bold text-black dark:text-zinc-300 dark:bg-zinc-700 dark:text-zinc-300">
                {c.hotel_name?.charAt(0) || 'H'}
              </div>
              <div className="min-w-0 flex-1 border-l-2 border-dashed border-black/10 dark:border-zinc-700 pl-4 dark:border-zinc-600">
                <p className="font-semibold text-black dark:text-zinc-100">{c.hotel_name}</p>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{c.discount_value}</p>
                <p className={`text-xs ${c.status === 'active' ? 'font-medium text-amber-600 dark:text-amber-400' : 'text-black dark:text-zinc-400'}`}>
                  {c.status === 'active' ? getExpiryCountdown(c.expires_at) : `Expired ${new Date(c.expires_at).toLocaleDateString()}`}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelected(c); }}
                className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                View
              </button>
            </div>
          ))}
          {filteredCoupons.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-black/10 dark:border-zinc-700 bg-zinc-50/50 p-12 text-center dark:bg-zinc-900/50">
              {tab === 'active' && (
                <>
                  <Ticket className="h-10 w-10 text-zinc-400 mb-3" />
                  <p className="text-black dark:text-zinc-400 font-medium">No active coupons available</p>
                  <p className="text-xs text-zinc-500 mt-1">Book a hotel to receive your first discount ticket!</p>
                </>
              )}
              {tab === 'used' && (
                <>
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3 opacity-80" />
                  <p className="text-black dark:text-zinc-400 font-medium">No used coupons yet</p>
                </>
              )}
              {tab === 'expired' && (
                <>
                  <History className="h-10 w-10 text-zinc-400 mb-3" />
                  <p className="text-black dark:text-zinc-400 font-medium">No expired coupons</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Selected coupon detail */}
        <div className="lg:min-w-[420px] print:w-full print:block">
          {selected ? (
            <div className="rounded-2xl border border-black/10 dark:border-zinc-700 bg-white p-6 shadow-sm dark:bg-zinc-900 print:shadow-none print:border-none print:p-0">
              {/* Actions Header - hidden when printing */}
              <div className="flex justify-between items-center mb-6 print:hidden">
                <span className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Coupon Details</span>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print / Save PDF</span>
                </button>
              </div>

              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-zinc-700 text-2xl font-bold text-black dark:text-zinc-300 dark:bg-zinc-700 dark:text-zinc-300">
                  {selected.hotel_name?.charAt(0) || 'H'}
                </div>
                <div>
                  <p className="font-bold text-lg text-black dark:text-zinc-100">{selected.hotel_name}</p>
                  <p className="font-black text-2xl text-emerald-600 dark:text-emerald-400 leading-tight tracking-tight mt-1">{selected.discount_value} OFF</p>
                  <p className={`text-sm mt-1 flex items-center gap-1.5 ${selected.status === 'active' ? 'font-medium text-amber-600 dark:text-amber-400' : 'text-zinc-500'}`}>
                    {selected.status === 'active'
                      ? <><span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span> {getExpiryCountdown(selected.expires_at)} · {new Date(selected.expires_at).toLocaleDateString()}</>
                      : <><XCircle className="h-3.5 w-3.5" /> Expired {new Date(selected.expires_at).toLocaleDateString()}</>}
                  </p>
                </div>
              </div>

              {/* Remind me 1 day before (active coupons only) */}
              {selected.status === 'active' && (
                <div className="mt-8 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/20 print:hidden">
                  <input
                    type="checkbox"
                    id="remind-1d"
                    checked={selected.remind_1_day_before ?? false}
                    onChange={(e) => handleRemindToggle(selected.id, e.target.checked)}
                    disabled={remindLoading}
                    className="h-4.5 w-4.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-800"
                  />
                  <label htmlFor="remind-1d" className="text-sm font-medium text-black dark:text-zinc-300">
                    Remind me 1 day before expiry
                  </label>
                </div>
              )}

              {/* Terms */}
              <div className="mt-6">
                <h3 className="text-sm font-bold uppercase tracking-wide text-black dark:text-zinc-400">Terms of Use</h3>
                <ul className="mt-2 space-y-1 text-sm text-black dark:text-zinc-300">
                  {DEFAULT_TERMS.map((t, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Code + QR (Premium Ticket style) */}
              <div className="mt-8 relative overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-gradient-to-b from-zinc-50 to-white p-8 dark:border-zinc-600 dark:from-zinc-800 dark:to-zinc-900 shadow-sm print:border-solid print:shadow-none">
                {/* Perforated edge circles */}
                <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white dark:bg-zinc-950 border-r border-dashed border-zinc-300 dark:border-zinc-600 print:hidden"></div>
                <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white dark:bg-zinc-950 border-l border-dashed border-zinc-300 dark:border-zinc-600 print:hidden"></div>

                <p className="mb-6 text-center font-mono text-3xl tracking-widest font-black text-black dark:text-zinc-100">
                  {selected.code}
                </p>
                <div className="flex justify-center bg-transparent">
                  <div className="rounded-xl border-4 border-white bg-white shadow-md print:shadow-none print:border-black">
                    <QRCodeSVG
                      value={typeof window !== 'undefined' ? `${window.location.origin}/redeem/${selected.code}` : ''}
                      size={200}
                      level="M"
                    />
                  </div>
                </div>
                <div className="mt-6 text-center space-y-1">
                  <p className="text-sm font-semibold text-black dark:text-zinc-300 uppercase tracking-widest">
                    Scan at Check-in
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    If scanning fails, provide the code <strong className="text-black dark:text-zinc-300">{selected.code}</strong> to the front desk.
                  </p>
                </div>
              </div>

              {/* Status & actions */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-black/10 dark:border-zinc-800 pt-6 print:hidden">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${selected.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : selected.status === 'redeemed'
                        ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        : selected.status === 'cancelled'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                    }`}
                >
                  {selected.status}
                </span>
                {selected.status === 'active' && (
                  <button
                    onClick={() => handleCancel(selected.id)}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Cancel Coupon
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-black/10 dark:border-zinc-700 bg-white p-12 dark:border-zinc-700 dark:bg-zinc-900/50">
              <p className="text-black dark:text-zinc-400">Select a coupon to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
