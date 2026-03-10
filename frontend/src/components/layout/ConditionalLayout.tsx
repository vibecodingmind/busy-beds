'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/auth/callback', '/hotel/login', '/hotel/register'];

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname?.startsWith(p));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}
