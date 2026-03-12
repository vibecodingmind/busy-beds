'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getPublicSettings } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [maintenance, setMaintenance] = useState<boolean | null>(null);

  useEffect(() => {
    getPublicSettings()
      .then((s) => setMaintenance(s.maintenance_mode === 'true' || s.maintenance_mode === '1'))
      .catch(() => setMaintenance(false));
  }, []);

  if (maintenance === null) return <>{children}</>;
  if (!maintenance) return <>{children}</>;

  const isAdmin = user?.role === 'admin';
  const isHotelPath = pathname?.startsWith('/hotel');
  if (isAdmin || pathname === '/status') return <>{children}</>;
  if (isHotelPath && user) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--background)]">
      <div className="rounded-2xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 max-w-md text-center">
        <h1 className="text-2xl font-bold text-black dark:text-zinc-100">We&apos;ll be back soon</h1>
        <p className="mt-4 text-black dark:text-zinc-400">
          We&apos;re performing scheduled maintenance. Please try again later.
        </p>
        <p className="mt-6 text-sm text-black dark:text-zinc-500">
          Check <a href="/status" className="text-[#FF385C] hover:underline">system status</a> for updates.
        </p>
      </div>
    </div>
  );
}
