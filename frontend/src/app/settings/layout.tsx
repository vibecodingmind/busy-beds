'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

// Common icon SVGs for the Sidebar
function IconOverview({ className = "w-5 h-5" }) {
    return (
        <svg className={className} fill="none" strokeWidth={1.5} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
    );
}

function IconProfile({ className = "w-5 h-5" }) {
    return (
        <svg className={className} fill="none" strokeWidth={1.5} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
    );
}

function IconCoupons({ className = "w-5 h-5" }) {
    return (
        <svg className={className} fill="none" strokeWidth={1.5} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
        </svg>
    );
}

function IconFavorites({ className = "w-5 h-5" }) {
    return (
        <svg className={className} fill="none" strokeWidth={1.5} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
    );
}

function IconHistory({ className = "w-5 h-5" }) {
    return (
        <svg className={className} fill="none" strokeWidth={1.5} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function IconAdmin({ className = "w-5 h-5" }) {
    return (
        <svg className={className} fill="none" strokeWidth={1.5} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    );
}

function IconBilling({ className = "w-5 h-5" }) {
    return (
        <svg className={className} fill="none" strokeWidth={1.5} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
    );
}

function IconRefer({ className = "w-5 h-5" }) {
    return (
        <svg className={className} fill="none" strokeWidth={1.5} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
    );
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, loading } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || loading) {
        return <div className="min-h-screen bg-[var(--background)] p-8">Loading...</div>;
    }

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
                    <p className="mt-2 text-muted">You must be logged in to view settings.</p>
                    <Link href="/login" className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-white">Log In</Link>
                </div>
            </div>
        );
    }

    // Define navigation groups
    const navGroups = [
        {
            title: "Settings",
            items: [
                { label: "Overview", href: "/settings/overview", icon: <IconOverview /> },
                { label: "My Coupons", href: "/settings/coupons", icon: <IconCoupons /> },
                { label: "Favorites", href: "/settings/favorites", icon: <IconFavorites /> },
                { label: "Recently Viewed", href: "/settings/viewed", icon: <IconHistory /> },
            ]
        },
        {
            title: "My Account",
            items: [
                { label: "Profile", href: "/settings/profile", icon: <IconProfile /> },
                { label: "Subscription", href: "/settings/billing", icon: <IconBilling /> },
                { label: "Refer & Earn", href: "/settings/referrals", icon: <IconRefer /> },
            ]
        }
    ];

    if (user.role === 'admin') {
        navGroups.push({
            title: "Administration",
            items: [
                { label: "Admin Dashboard", href: "/admin", icon: <IconAdmin /> },
            ]
        });
    }

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="mx-auto flex max-w-7xl flex-col md:flex-row py-8 px-4 sm:px-6 lg:px-8 gap-8">

                {/* Left Sidebar */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <nav className="space-y-8">
                        {navGroups.map((group) => (
                            <div key={group.title}>
                                <h3 className="px-3 text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                                    {group.title}
                                </h3>
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                                        ? 'bg-black/5 dark:bg-white/10 text-foreground'
                                                        : 'text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
                                                    }`}
                                            >
                                                <span className={isActive ? 'text-primary' : 'text-zinc-400 dark:text-zinc-500'}>
                                                    {item.icon}
                                                </span>
                                                {item.label}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 min-w-0">
                    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[600px]">
                        {children}
                    </div>
                </main>

            </div>
        </div>
    );
}
