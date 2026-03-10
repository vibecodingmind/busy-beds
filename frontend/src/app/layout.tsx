import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { HotelAuthProvider } from '@/contexts/HotelAuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { ToastProvider } from '@/contexts/ToastContext';
import ThemeScript from '@/components/ThemeScript';
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#171717' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-[var(--background)] text-[var(--foreground)]`}>
        <ThemeScript />
        <PWARegister />
        <ThemeProvider>
          <I18nProvider>
          <ToastProvider>
          <AuthProvider>
            <HotelAuthProvider>
              <ConditionalLayout>{children}</ConditionalLayout>
            </HotelAuthProvider>
          </AuthProvider>
          </ToastProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
