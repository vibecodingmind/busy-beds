'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function HotelLoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const redirect = searchParams.get('redirect');
    const url = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';
    router.replace(url);
  }, [router, searchParams]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-zinc-600">Redirecting...</p>
    </div>
  );
}

export default function HotelLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-zinc-600">Loading...</p></div>}>
      <HotelLoginRedirect />
    </Suspense>
  );
}
