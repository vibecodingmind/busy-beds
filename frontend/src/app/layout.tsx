import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { HotelAuthProvider } from '@/contexts/HotelAuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { ToastProvider } from '@/contexts/ToastContext';
import PWARegister from '@/components/PWARegister';
import ConditionalLayout from '@/components/layout/ConditionalLayout';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Busy Beds - Hotel Coupon Membership',
  description: 'Subscribe to access hotel discount coupons',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Busy Beds' },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-[var(--background)] text-[var(--foreground)]`}>
        <PWARegister />
        <I18nProvider>
          <ToastProvider>
            <AuthProvider>
              <HotelAuthProvider>
                <ConditionalLayout>{children}</ConditionalLayout>
              </HotelAuthProvider>
            </AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
