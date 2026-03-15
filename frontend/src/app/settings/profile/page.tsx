'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { auth as authApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

function VerifiedIcon() {
    return (
        <svg className="h-5 w-5 text-blue-500 ml-2 inline" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497a4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
    );
}

export default function ProfileSettingsPage() {
    const { user, refreshUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        gender: '',
        nationality: '',
        address: '',
        phone: '',
        email: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
                gender: user.gender || '',
                nationality: user.nationality || '',
                address: user.address || '',
                phone: user.phone || '',
                email: user.email || ''
            });
        }
    }, [user]);

    if (!user) return null;

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await authApi.updateProfile({
                name: formData.name,
                dob: formData.dob || null,
                gender: formData.gender || null,
                nationality: formData.nationality || null,
                address: formData.address || null,
                phone: formData.phone || null,
                email: formData.email
            });
            await refreshUser();
            setIsEditing(false);
            toast.success('Profile updated successfully');
        } catch (err: any) {
            toast.error(err.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setIsLoading(true);
        try {
            await authApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
            setIsChangingPassword(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast.success('Password updated successfully');
        } catch (err: any) {
            toast.error(err.message || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendEmail = async () => {
        try {
            await authApi.resendVerification(user.email);
            toast.success('Verification email sent');
        } catch (err: any) {
            toast.error(err.message || 'Failed to resend email');
        }
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'Not set';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="flex flex-col h-full bg-card">
            {/* Header Breadcrumb */}
            <div className="flex items-center gap-2 border-b border-border px-8 py-5 text-sm">
                <span className="text-muted">My Account</span>
                <span className="text-zinc-300 dark:text-zinc-600">/</span>
                <span className="font-medium text-foreground flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                    Profile
                </span>
            </div>

            <div className="p-8 max-w-4xl overflow-y-auto">

                {/* Avatar Section */}
                <div className="mb-10 flex flex-col items-start relative z-10">
                    <div className="relative">
                        <div className="h-24 w-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold border-4 border-card shadow-sm">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                user.name?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                    </div>
                    <div className="mt-4 w-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground flex items-center">
                                    {user.name}
                                    {user.email_verified && <VerifiedIcon />}
                                </h2>
                                <p className="text-muted text-sm mt-0.5 flex items-center gap-2">
                                    {user.email}
                                    {!user.email_verified && (
                                        <button
                                            onClick={handleResendEmail}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            Verify Email
                                        </button>
                                    )}
                                </p>
                            </div>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {isEditing ? (
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted">Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={formData.dob}
                                        onChange={e => setFormData({ ...formData, dob: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted">Gender</label>
                                    <select
                                        value={formData.gender}
                                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted">Nationality</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. American"
                                        value={formData.nationality}
                                        onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted">Phone Number</label>
                                    <input
                                        type="tel"
                                        placeholder="(213) 555-1234"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted">Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none min-h-[80px]"
                                    placeholder="Enter your address"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-8">
                        {/* Section 1: Personal Details */}
                        <div>
                            <h3 className="text-base font-semibold text-foreground mb-4">Personal details</h3>
                            <div className="rounded-xl border border-border bg-black/[0.02] dark:bg-white/[0.02] overflow-hidden">
                                <DetailRow label="Full name" value={user.name} />
                                <DetailRow label="Date of Birth" value={formatDate(user.dob)} />
                                <DetailRow label="Gender" value={user.gender || 'Not set'} />
                                <DetailRow label="Nationality" value={user.nationality || 'Not set'} />
                                <DetailRow label="Address" value={user.address || 'Not set'} />
                                <DetailRow label="Phone Number" value={user.phone || 'Not set'} />
                                <DetailRow label="Email" value={user.email} />
                            </div>
                        </div>

                        {/* Section 2: Security Settings */}
                        <div>
                            <h3 className="text-base font-semibold text-foreground mb-4">Security Settings</h3>
                            <div className="rounded-xl border border-border bg-black/[0.02] dark:bg-white/[0.02] overflow-hidden">
                                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-border/60">
                                    <div className="px-6 py-4 text-sm text-muted">Password:</div>
                                    <div className="px-6 py-4 text-sm text-foreground sm:col-span-2 flex justify-between items-center">
                                        <span>••••••••</span>
                                        <button
                                            onClick={() => setIsChangingPassword(!isChangingPassword)}
                                            className="text-primary hover:underline font-medium"
                                        >
                                            {isChangingPassword ? 'Cancel' : 'Change'}
                                        </button>
                                    </div>
                                </div>
                                {isChangingPassword && (
                                    <div className="px-6 py-6 bg-muted/30 border-b border-border/60">
                                        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-sm">
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-muted">Current Password</label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={passwordData.currentPassword}
                                                    onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-muted">New Password</label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={passwordData.newPassword}
                                                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-muted">Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={passwordData.confirmPassword}
                                                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                                            >
                                                {isLoading ? 'Updating...' : 'Update Password'}
                                            </button>
                                        </form>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-3">
                                    <div className="px-6 py-4 text-sm text-muted">Two-Factor Auth:</div>
                                    <div className="px-6 py-4 text-sm text-foreground sm:col-span-2 flex justify-between items-center">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${user.totp_enabled ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-800/20 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${user.totp_enabled ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
                                            {user.totp_enabled ? 'Enabled' : 'Disconnected'}
                                        </span>
                                        <button className="text-primary hover:underline font-medium">
                                            {user.totp_enabled ? 'Manage' : 'Setup'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string, value: string | null | undefined }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-border/60 last:border-0 hover:bg-muted/50 transition-colors">
            <div className="px-6 py-4 text-sm text-muted">{label}:</div>
            <div className="px-6 py-4 text-sm text-foreground sm:col-span-2 font-medium">{value}</div>
        </div>
    );
}
