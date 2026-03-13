import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy configuration for Next.js 16+
 *
 * Authentication is now handled client-side in React components via AuthContext and useEffect guards.
 * This proxy no longer performs server-side authentication checks as per Next.js 16 guidelines.
 *
 * Protected routes are still secured through client-side authentication checks in each page component.
 */

export function proxy(request: NextRequest) {
  // Authentication logic has been moved to client-side React components
  // No server-side redirects are performed here anymore per Next.js 16 guidelines

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard',
    '/my-coupons',
    '/profile/:path*',
    '/subscription',
    '/referral',
    '/favorites',
    '/viewed',
    '/compare',
    '/hotel/dashboard',
    '/hotel/redeem',
  ],
};
