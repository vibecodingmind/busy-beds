'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import ErrorBoundary from '@/components/ErrorBoundary';
import MaintenanceGate from '@/components/MaintenanceGate';

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/auth/callback', '/auth/google/callback', '/auth/facebook/callback', '/auth/linkedin/callback', '/hotel/login', '/hotel/register', '/bootstrap-admin'];

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname?.startsWith(p));

  if (isAuthPage) {
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }

  return (
    <ErrorBoundary>
      <MaintenanceGate>
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8 bg-[var(--background)] min-h-[calc(100vh-8rem)]">{children}</main>
        <Footer />
      </MaintenanceGate>
    </ErrorBoundary>
  );
}
