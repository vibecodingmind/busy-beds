import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protected route groups:
 * - /admin/** → requires admin role (checked via JWT if stored; falls back to login)
 * - /dashboard, /my-coupons, /profile, /subscription, /referral, /favorites → user must be logged in
 * - /hotel/dashboard, /hotel/redeem → hotel accounts only
 *
 * We cannot fully verify JWTs at edge without importing crypto (not available in all edge runtimes).
 * We use a lightweight check: if the auth token cookie/header is absent, redirect to /login.
 * The actual role verification still happens in each page's useEffect guard + the backend API.
 *
 * Store access token in a cookie named 'access_token' for this middleware to work.
 * The AuthContext already stores the token in localStorage — if you want edge protection,
 * also write it to a cookie on login. Until then, this middleware prevents unauthenticated
 * direct URL access to protected pages without a full JS bundle evaluation.
 */

const USER_PROTECTED = [
  '/dashboard',
  '/my-coupons',
  '/profile',
  '/subscription',
  '/referral',
  '/favorites',
  '/viewed',
  '/compare',
];

const HOTEL_PROTECTED = ['/hotel/dashboard', '/hotel/redeem'];

const ADMIN_PROTECTED = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for auth token in cookies (set during login) or Authorization header
  const userToken =
    request.cookies.get('access_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  const hotelToken = request.cookies.get('hotel_token')?.value;

  const isAdminPath = ADMIN_PROTECTED.some((p) => pathname.startsWith(p));
  const isHotelPath = HOTEL_PROTECTED.some((p) => pathname.startsWith(p));
  const isUserPath = USER_PROTECTED.some((p) => pathname.startsWith(p));

  // If accessing a protected path without any token, redirect to the appropriate login page
  if ((isAdminPath || isUserPath) && !userToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isHotelPath && !hotelToken) {
    const loginUrl = new URL('/hotel/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

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
