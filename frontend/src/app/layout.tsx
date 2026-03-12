import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { HotelAuthProvider } from '@/contexts/HotelAuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { ToastProvider } from '@/contexts/ToastContext';
import PWARegister from '@/components/PWARegister';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import { ThemeProvider } from '@/contexts/ThemeContext';
import CookieConsent from '@/components/CookieConsent';

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
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="yJQsS05ZoMgj_Q1tABEL_RLj6zs1c54e8MlcIsjMv7A" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('busybeds-theme');if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-[var(--background)] text-[var(--foreground)]`}>
        <ThemeProvider>
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
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
