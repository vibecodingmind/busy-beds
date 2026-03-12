'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function FacebookCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state') || '/dashboard';
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1').replace(/\/api\/v1\/?$/, '');
    const completeUrl = `${apiBase}/auth/facebook/complete?${new URLSearchParams({ code: code || '', state }).toString()}`;
    window.location.href = completeUrl;
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-foreground">Completing Facebook sign-in...</p>
    </div>
  );
}

export default function FacebookCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><p className="text-foreground">Loading...</p></div>}>
      <FacebookCallbackContent />
    </Suspense>
  );
}
