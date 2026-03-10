'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const returnTo = searchParams.get('returnTo') || '/dashboard';
    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }
    if (token) {
      localStorage.setItem('token', token);
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((user) => setUser(user))
        .catch(() => {})
        .finally(() => router.replace(returnTo.startsWith('/') ? returnTo : `/${returnTo}`));
    } else {
      router.replace('/login');
    }
  }, [searchParams, router, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-zinc-900">Signing you in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-zinc-900">Loading...</p></div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
