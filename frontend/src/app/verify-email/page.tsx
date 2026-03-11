'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';
import AuthLayout from '@/components/auth/AuthLayout';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Invalid or missing verification link.');
      return;
    }
    setStatus('loading');
    auth
      .verifyEmail(token)
      .then(() => {
        setStatus('success');
        setTimeout(() => router.push('/login'), 3000);
      })
      .catch((err) => {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Verification failed');
      });
  }, [token, router]);

  if (status === 'loading' || status === 'idle') {
    return (
      <AuthLayout title="Verify your email" subtitle="Verifying..." switchText="Back to " switchLabel="login" switchLink="/login">
        <p className="text-zinc-400">Please wait...</p>
      </AuthLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthLayout title="Email verified" subtitle="Your email has been verified." switchText="Back to " switchLabel="login" switchLink="/login">
        <p className="text-zinc-400">Redirecting you to login...</p>
        <Link href="/login" className="mt-4 block text-[#FF385C] hover:text-[#ff6b81] transition-colors">
          Go to Login
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verification failed" subtitle={error} switchText="Back to " switchLabel="login" switchLink="/login">
      <Link href="/login" className="block text-[#FF385C] hover:text-[#ff6b81] transition-colors">
        Go to Login
      </Link>
      <Link href="/profile" className="mt-2 block text-sm text-zinc-400 hover:text-zinc-300">
        Request a new verification email from Account settings
      </Link>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <AuthLayout title="Verify your email" subtitle="Loading..." switchText="Back to " switchLabel="login" switchLink="/login">
        <p className="text-zinc-400">Please wait...</p>
      </AuthLayout>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
