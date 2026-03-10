'use client';

import { useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/api';
import AuthLayout from '@/components/auth/AuthLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await auth.forgotPassword(email);
      setSent(true);
      if (res.resetUrl) setResetUrl(res.resetUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setError('');
    try {
      const res = await auth.resendVerification(email);
      setResendSent(true);
      if (res.verifyUrl) setVerifyUrl(res.verifyUrl);
    } catch {
      setResendSent(true);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="If that email exists, we sent a reset link"
        switchText="Remember your password?"
        switchLink="/login"
        switchLabel="Login"
      >
        <div className="space-y-4">
          <p className="text-zinc-600">
            Check your inbox for a link to reset your password. The link expires in 1 hour.
          </p>
          {resetUrl && (
            <div className="rounded-lg bg-amber-50 p-4 text-sm">
              <p className="font-medium text-amber-800">Dev mode: Reset link</p>
              <a href={resetUrl} className="mt-2 block break-all text-amber-700 underline">
                {resetUrl}
              </a>
            </div>
          )}
          <Link href="/login" className="block text-center text-zinc-600 hover:text-zinc-900">
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Enter your email and we'll send a reset link"
      switchText="Remember your password?"
      switchLink="/login"
      switchLabel="Login"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
            Your Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 py-2.5 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Didn&apos;t receive a verification email?{' '}
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={!email || resendSent}
            className="text-zinc-900 underline hover:no-underline disabled:opacity-50"
          >
            {resendSent ? 'Sent' : 'Resend link'}
          </button>
        </p>
        {verifyUrl && (
          <div className="rounded-lg bg-amber-50 p-4 text-sm">
            <p className="font-medium text-amber-800">Dev mode: Verification link</p>
            <a href={verifyUrl} className="mt-2 block break-all text-amber-700 underline">
              {verifyUrl}
            </a>
          </div>
        )}
      </form>
    </AuthLayout>
  );
}
