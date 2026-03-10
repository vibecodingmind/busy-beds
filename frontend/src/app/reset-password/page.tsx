'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';
import AuthLayout from '@/components/auth/AuthLayout';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Invalid reset link. Request a new one.');
      return;
    }
    setLoading(true);
    try {
      await auth.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <p className="text-zinc-400">Password reset successfully. Redirecting to login...</p>
        <Link href="/login" className="block text-[#FF385C] hover:text-[#ff6b81] transition-colors">
          Go to Login
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="text-red-300">Invalid or missing reset token. Please request a new reset link.</p>
        <Link href="/forgot-password" className="block text-[#FF385C] hover:text-[#ff6b81] transition-colors">
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-800/50 p-3 text-sm text-red-300">{error}</div>
      )}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
          New Password
        </label>
        <div className="relative mt-1">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Enter your password"
            className="w-full rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2.5 pr-10 text-white placeholder:text-zinc-500 focus:border-[#FF385C] focus:outline-none focus:ring-1 focus:ring-[#FF385C]"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-zinc-300">
          Confirm Password
        </label>
        <input
          id="confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          placeholder="Confirm your password"
          className="mt-1 w-full rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-[#FF385C] focus:outline-none focus:ring-1 focus:ring-[#FF385C]"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#FF385C] py-3 font-medium text-white hover:bg-[#e31c5f] disabled:opacity-50 transition-colors"
      >
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your new password"
      switchText="Remember your password?"
      switchLink="/login"
      switchLabel="Login"
    >
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
