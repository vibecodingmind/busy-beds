import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/dashboard', destination: '/settings/overview', permanent: true },
      { source: '/profile', destination: '/settings/profile', permanent: true },
      { source: '/favorites', destination: '/settings/favorites', permanent: true },
      { source: '/viewed', destination: '/settings/viewed', permanent: true },
      { source: '/referral', destination: '/settings/referrals', permanent: true },
      { source: '/my-coupons', destination: '/settings/coupons', permanent: true },
      { source: '/subscription', destination: '/settings/billing', permanent: true },
    ];
  },
};

export default nextConfig;
