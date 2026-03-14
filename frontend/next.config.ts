import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      // Allow any https origin — hotel images come from user-provided URLs
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
};

export default nextConfig;
