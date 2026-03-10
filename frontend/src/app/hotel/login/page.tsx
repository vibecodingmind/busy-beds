'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HotelLoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login?type=hotel');
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-zinc-600">Redirecting...</p>
    </div>
  );
}
