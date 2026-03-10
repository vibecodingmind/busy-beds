'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';

export default function ProfilePage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [tab, setTab] = useState<'profile' | 'password'>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const u = await auth.updateProfile({ name, email });
      setUser?.({ ...u, id: u.id });
      setMessage('Profile updated successfully');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await auth.changePassword(currentPassword, newPassword);
      setMessage('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return <div className="py-12 text-zinc-900 dark:text-zinc-400">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Account</h1>
        <p className="mt-1 text-zinc-900 dark:text-zinc-400">Manage your profile and security.</p>
      </div>

      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setTab('profile')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'profile'
              ? 'border-emerald-500 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300'
          }`}
        >
          Profile
        </button>
        <button
          type="button"
          onClick={() => setTab('password')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'password'
              ? 'border-emerald-500 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300'
          }`}
        >
          Change Password
        </button>
      </div>

      <div className="max-w-md rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        {message && (
          <div className={`mb-4 rounded-lg p-3 text-sm ${
            message.includes('success')
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
          }`}>
            {message}
          </div>
        )}

        {tab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-300">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-300">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-300">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
