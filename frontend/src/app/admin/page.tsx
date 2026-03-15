'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api';

// --- Internal Icons ---
function IconUsers({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function IconHotels({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function IconCoupons({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
    </svg>
  );
}

function IconSubscriptions({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  );
}

function IconRedemptions({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

const MODULE_GROUPS = [
  {
    title: "Core Operations",
    items: [
      { label: "Hotels", href: "/admin/hotels", description: "Manage property listings & details", icon: <IconHotels className="w-5 h-5" /> },
      { label: "Users", href: "/admin/users", description: "Manage client accounts & roles", icon: <IconUsers className="w-5 h-5" /> },
      { label: "Coupons", href: "/admin/coupons", description: "Track generated discount codes", icon: <IconCoupons className="w-5 h-5" /> },
      { label: "Referrals", href: "/admin/referral-withdrawals", description: "Manage affiliate payouts", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    ]
  },
  {
    title: "Revenue & Growth",
    items: [
      { label: "Plans", href: "/admin/plans", description: "Subscription pricing & logic", icon: <IconSubscriptions className="w-5 h-5" /> },
      { label: "Export", href: "/admin/export", description: "Download data in CSV format", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg> },
    ]
  },
  {
    title: "System & Content",
    items: [
      { label: "Pages", href: "/admin/pages", description: "Policy & dynamic content", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
      { label: "Amenities", href: "/admin/amenities", description: "Filter categories & icons", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.014 4.128c.348.143.73.22 1.128.22a4.5 4.5 0 004.14-6.357m0 0a15.998 15.998 0 013.388 1.62m-3.388-1.62l.001-.001m0 0a2.25 2.25 0 002.247-2.113 7.5 7.5 0 00-14.972 0 2.25 2.25 0 002.247 2.113 14.516 14.516 0 0114.998 0z" /></svg> },
      { label: "Inbox", href: "/admin/contact-inbox", description: "Form submissions & support", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488a4.5 4.5 0 01-4.178 0L3.433 11.887A2.25 2.25 0 012.25 9.906V9M21.75 9V7.5a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 7.5V9m19.5 0l-8.411 4.529a2.25 2.25 0 01-2.178 0L2.25 9" /></svg> },
      { label: "Audit Log", href: "/admin/audit-log", description: "Trace administrative actions", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
      { label: "Setting", href: "/admin/settings", description: "API keys & system config", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-7.5 7.5V21m0-16.5V3" /></svg> },
    ]
  },
];

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<{
    total_users: number;
    total_hotels: number;
    active_subscriptions: number;
    active_coupons: number;
    total_redemptions: number;
  } | null>(null);
  const [chartData, setChartData] = useState<{ signups: { date: string; count: number }[]; redemptions: { date: string; count: number }[] } | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    admin.analytics().then(setAnalytics).catch(() => { });
    admin.analyticsChart().then(setChartData).catch(() => { });
    admin.pendingHotelAccounts().then((p: any) => setPendingCount(p.accounts.length)).catch(() => { });
  }, [user]);

  if (authLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-zinc-200 dark:bg-zinc-800 h-10 w-10"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded col-span-2"></div>
                <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Header section */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-medium text-muted uppercase tracking-wider mb-2">
          <span>Admin</span>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <span className="text-foreground">Dashboard</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Command Center</h1>
        <p className="text-muted">Welcome back, {user.name}. Here&apos;s your platform status.</p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Total Users', value: analytics?.total_users, icon: <IconUsers className="w-5 h-5" />, color: 'primary' },
          { label: 'Total Hotels', value: analytics?.total_hotels, icon: <IconHotels className="w-5 h-5" />, color: 'emerald' },
          { label: 'Active Subs', value: analytics?.active_subscriptions, icon: <IconSubscriptions className="w-5 h-5" />, color: 'blue' },
          { label: 'Active Coupons', value: analytics?.active_coupons, icon: <IconCoupons className="w-5 h-5" />, color: 'amber' },
          { label: 'Redemptions', value: analytics?.total_redemptions, icon: <IconRedemptions className="w-5 h-5" />, color: 'purple' },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
            <div className={`absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity dark:opacity-[0.05] dark:group-hover:opacity-[0.1]`}>
              <div className="scale-[3.5] origin-top-right">
                {stat.icon}
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg bg-black/5 dark:bg-white/5 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                {stat.icon}
              </div>
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{stat.value ?? '...'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* High Priority Actions */}
      {(pendingCount !== null && pendingCount > 0) && (
        <Link href="/admin/hotel-accounts">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 flex items-center justify-between group hover:bg-amber-500/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500 text-white animate-pulse">
                <IconHotels className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-amber-700 dark:text-amber-400">Action Required: Pending Approvals</h3>
                <p className="text-amber-600/80 dark:text-amber-400/60 text-sm">There are {pendingCount} new property accounts waiting for your review.</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              Review Now <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
        </Link>
      )}

      {/* Charts & Analytics Container */}
      {chartData && (chartData.signups.length > 0 || chartData.redemptions.length > 0) && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="px-8 py-5 border-b border-border bg-black/[0.01] dark:bg-white/[0.01] flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
              Platform Growth (Last 14 Days)
            </h2>
          </div>
          <div className="p-8 grid gap-12 lg:grid-cols-2">
            {/* Signups Chart */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-bold text-foreground uppercase tracking-widest">Signups</span>
                </div>
                <span className="text-xs text-muted font-medium">{chartData.signups[0]?.date} - {chartData.signups[chartData.signups.length - 1]?.date}</span>
              </div>
              <div className="flex h-32 items-end gap-1.5 px-1 py-1 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-border/50">
                {chartData.signups.map((d: any, i: number) => (
                  <div key={i} className="flex-1 group relative h-full flex items-end">
                    <div
                      className="w-full rounded-t-sm bg-blue-500/80 hover:bg-blue-500 transition-colors"
                      style={{ height: `${Math.max(4, (d.count / Math.max(1, Math.max(...chartData.signups.map((x: any) => x.count)))) * 100)}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {d.date}: {d.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Redemptions Chart */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-bold text-foreground uppercase tracking-widest">Redemptions</span>
                </div>
                <span className="text-xs text-muted font-medium">{chartData.redemptions[0]?.date} - {chartData.redemptions[chartData.redemptions.length - 1]?.date}</span>
              </div>
              <div className="flex h-32 items-end gap-1.5 px-1 py-1 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-border/50">
                {chartData.redemptions.map((d: any, i: number) => (
                  <div key={i} className="flex-1 group relative h-full flex items-end">
                    <div
                      className="w-full rounded-t-sm bg-emerald-500/80 hover:bg-emerald-500 transition-colors"
                      style={{ height: `${Math.max(4, (d.count / Math.max(1, Math.max(...chartData.redemptions.map((x: any) => x.count)))) * 100)}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {d.date}: {d.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modules Categorized Grid */}
      <div className="space-y-8">
        {MODULE_GROUPS.map((group) => (
          <div key={group.title} className="space-y-4">
            <h2 className="text-xs font-bold text-muted uppercase tracking-[0.2em] px-1">{group.title}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {group.items.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/30 transition-all hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-muted group-hover:text-primary transition-colors">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{item.label}</h3>
                        <p className="text-xs text-muted mt-0.5 line-clamp-1">{item.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
