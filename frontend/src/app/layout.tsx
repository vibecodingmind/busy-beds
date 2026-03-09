import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { HotelAuthProvider } from '@/contexts/HotelAuthContext';
import Header from '@/components/layout/Header';

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}>
        <AuthProvider>
          <HotelAuthProvider>
            <Header />
            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          </HotelAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
