'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

export default function ProfilePage() {
  const { user, loading: authLoading, setUser, logout } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tab, setTab] = useState<'profile' | 'password'>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone ?? '');
      setAvatarUrl(user.avatar_url ?? '');
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const u = await auth.updateProfile({
        name,
        email,
        phone: phone.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
      });
      setUser?.({ ...user!, ...u });
      setMessage('Profile updated successfully');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('New password and confirm password do not match');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await auth.changePassword(currentPassword, newPassword);
      setMessage('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setResendLoading(true);
    try {
      await auth.resendVerification(user.email);
      toast('Verification email sent if your email is registered.', 'success');
    } catch {
      toast('Could not send verification email.', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (authLoading || !user) return <div className="py-12 text-zinc-400">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Account settings</h1>
        <p className="mt-1 text-zinc-400">Manage your profile, security, and preferences.</p>
      </div>

      <div className="flex gap-2 border-b border-zinc-700">
        <button
          type="button"
          onClick={() => setTab('profile')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'profile'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-300'
          }`}
        >
          Profile
        </button>
        <button
          type="button"
          onClick={() => setTab('password')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'password'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-300'
          }`}
        >
          Change Password
        </button>
      </div>

      <div className="max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6">
        {message && (
          <div
            className={`mb-4 rounded-lg p-3 text-sm ${
              message.includes('success')
                ? 'bg-emerald-950/40 text-emerald-300'
                : 'bg-red-950/40 text-red-300'
            }`}
          >
            {message}
          </div>
        )}

        {tab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300">Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300">Avatar URL (optional)</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {avatarUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={avatarUrl}
                    alt="Avatar preview"
                    className="h-12 w-12 rounded-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <span className="text-xs text-zinc-500">Preview</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || newPassword !== confirmPassword}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>

      {/* Email verification */}
      <div className="max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6">
        <h2 className="text-sm font-semibold text-zinc-200">Email verification</h2>
        {user.email_verified ? (
          <p className="mt-2 text-sm text-emerald-400">Your email is verified.</p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-sm text-zinc-400">Your email is not verified yet.</p>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="rounded-lg bg-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:bg-zinc-600 disabled:opacity-50"
            >
              {resendLoading ? 'Sending...' : 'Resend verification email'}
            </button>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6">
        <h2 className="text-sm font-semibold text-zinc-200">Quick links</h2>
        <ul className="mt-3 space-y-2">
          <li>
            <Link href="/dashboard" className="text-sm text-emerald-400 hover:underline">
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/favorites" className="text-sm text-emerald-400 hover:underline">
              Favourites
            </Link>
          </li>
          <li>
            <Link href="/my-coupons" className="text-sm text-emerald-400 hover:underline">
              My Coupons
            </Link>
          </li>
          <li>
            <Link href="/subscription" className="text-sm text-emerald-400 hover:underline">
              Subscription
            </Link>
          </li>
          <li>
            <Link href="/referral" className="text-sm text-emerald-400 hover:underline">
              Refer & Earn
            </Link>
          </li>
        </ul>
      </div>

      {/* Log out */}
      <div className="max-w-md">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-zinc-600 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
