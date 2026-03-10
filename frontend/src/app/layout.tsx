import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { HotelAuthProvider } from '@/contexts/HotelAuthContext';
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
            <ConditionalLayout>{children}</ConditionalLayout>
          </HotelAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
