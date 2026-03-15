'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

function VerifiedIcon() {
    return (
        <svg className="h-5 w-5 text-blue-500 ml-2 inline" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
    );
}

export default function ProfileSettingsPage() {
    const { user } = useAuth();

    // For demonstration per screenshot, using layout matching text formats
    // The actual database might not have all these fields yet, but the UI is prepared.
    const [profileData] = useState({
        dob: 'January 1, 1987',
        gender: 'Female',
        nationality: 'American',
        address: 'California - United States',
        phone: '(213) 555-1234',
    });

    if (!user) return null;

    return (
        <div className="flex flex-col h-full bg-card">
            {/* Header Breadcrumb equivalent */}
            <div className="flex items-center gap-2 border-b border-border px-8 py-5 text-sm">
                <span className="text-muted">My Account</span>
                <span className="text-zinc-300 dark:text-zinc-600">/</span>
                <span className="font-medium text-foreground flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                    Profile
                </span>
            </div>

            <div className="p-8 max-w-4xl">

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
                        {/* Absolute positioning of decorative background elements could go behind here to mimic the screenshot perfectly */}
                    </div>
                    <div className="mt-4">
                        <h2 className="text-2xl font-bold text-foreground flex items-center">
                            {user.name}
                            <VerifiedIcon />
                        </h2>
                        <p className="text-muted text-sm mt-0.5">{user.email}</p>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="space-y-8">

                    {/* Section 1: Personal Details */}
                    <div>
                        <h3 className="text-base font-semibold text-foreground mb-4">Personal details</h3>
                        <div className="rounded-xl border border-border bg-black/[0.02] dark:bg-white/[0.02] overflow-hidden">
                            <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-border/60">
                                <div className="px-6 py-4 text-sm text-muted">Full name:</div>
                                <div className="px-6 py-4 text-sm text-foreground sm:col-span-2 font-medium">{user.name}</div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-border/60">
                                <div className="px-6 py-4 text-sm text-muted">Date of Birth:</div>
                                <div className="px-6 py-4 text-sm text-foreground sm:col-span-2">{profileData.dob}</div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-border/60">
                                <div className="px-6 py-4 text-sm text-muted">Gender:</div>
                                <div className="px-6 py-4 text-sm text-foreground sm:col-span-2">{profileData.gender}</div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-border/60">
                                <div className="px-6 py-4 text-sm text-muted">Nationality:</div>
                                <div className="px-6 py-4 text-sm text-foreground sm:col-span-2">{profileData.nationality}</div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-border/60">
                                <div className="px-6 py-4 text-sm text-muted">Address:</div>
                                <div className="px-6 py-4 text-sm text-foreground sm:col-span-2">{profileData.address}</div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-border/60">
                                <div className="px-6 py-4 text-sm text-muted">Phone Number:</div>
                                <div className="px-6 py-4 text-sm text-foreground sm:col-span-2">{profileData.phone}</div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3">
                                <div className="px-6 py-4 text-sm text-muted">Email:</div>
                                <div className="px-6 py-4 text-sm text-foreground sm:col-span-2">{user.email}</div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Security Settings (Placeholder per design spec) */}
                    <div>
                        <h3 className="text-base font-semibold text-foreground mb-4">Security Settings</h3>
                        <div className="rounded-xl border border-border bg-black/[0.02] dark:bg-white/[0.02] overflow-hidden">
                            <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-border/60">
                                <div className="px-6 py-4 text-sm text-muted">Password:</div>
                                <div className="px-6 py-4 text-sm text-foreground sm:col-span-2 flex justify-between items-center">
                                    <span>••••••••</span>
                                    <button className="text-primary hover:underline font-medium">Change</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3">
                                <div className="px-6 py-4 text-sm text-muted">Two-Factor Auth:</div>
                                <div className="px-6 py-4 text-sm text-foreground sm:col-span-2 flex justify-between items-center">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span> Disconnected
                                    </span>
                                    <button className="text-primary hover:underline font-medium">Setup</button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
