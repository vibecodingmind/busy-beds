# Features Added - Busy Beds

Summary of all features implemented.

## 1. Dark Mode
- **ThemeContext**: Light / Dark / System with localStorage persistence
- **ThemeToggle**: Header button (sun/moon/monitor) cycles themes
- **ThemeScript**: Prevents flash on load
- **CSS**: `dark:` variants on header, hotel dashboard, referral, and key components

## 2. PWA (Progressive Web App)
- **manifest.json**: App name, icons paths, theme color, standalone display
- **sw.js**: Service worker caches GET requests from same origin
- **PWARegister**: Registers service worker on load
- **Note**: Add `icon-192.png` and `icon-512.png` to `/public` for install icons

## 3. Hotel Dashboard Improvements
- **Date range filter**: Start/End date inputs for redemptions
- **CSV export**: Export redemptions to CSV file

## 4. Reviews & Ratings
- **Schema**: `hotel_reviews` table (hotel_id, user_id, rating 1–5, comment)
- **API**: `GET /reviews/hotels/:id`, `POST /reviews/hotels/:id`, `GET /reviews/hotels/:id/me`
- **UI**: HotelReviews component on hotel detail page (stars, form, list)
- One review per user per hotel (upsert on submit)

## 5. Referral Program
- **Schema**: `referral_code` on users, `referrals` table
- **API**: `GET /referrals/me` (code + referred users)
- **Auth**: Register accepts `referral_code` or `?ref=CODE`; creates referral link
- **UI**: `/referral` page with code, share link, copy button, referred list

## 6. i18n (Internationalization)
- **next-intl**: EN / ES with locale switcher in header
- **Messages**: `src/i18n/messages/en.json`, `es.json`
- **Scope**: Nav labels (Browse, Dashboard, My Coupons, etc.)

## 7. Stripe Payments
- **Backend**: 
  - `POST /stripe/create-checkout-session` (plan_id) → redirect URL
  - `POST /stripe/webhook` (raw body) for checkout.session.completed, subscription events
- **Model**: `createStripeSubscription()`, `stripe_price_id` on plans
- **Frontend**: Subscribe tries Stripe first; falls back to direct DB subscription if 503
- **Env**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `stripe_price_id` on subscription_plans

## 8. Email Notifications
- **Resend**: Welcome email on register, hotel approval email on admin approve
- **Service**: `src/services/email.ts` – `sendWelcomeEmail`, `sendHotelApprovalEmail`, `sendCouponExpiryReminder`
- **Env**: `RESEND_API_KEY`, `EMAIL_FROM`, `FRONTEND_URL`

---

## Round 2 (Remaining)

### 9. PWA Icons
- **Script**: `npm run generate-icons` fetches placeholder icons (192x192, 512x512)
- Icons saved to `public/icon-192.png` and `public/icon-512.png`

### 10. More i18n (French)
- Added `fr.json` and locale switcher option FR

### 11. Password Reset Email
- **sendPasswordResetEmail**: Sends reset link via Resend when user requests it
- Forgot password flow now sends email (when RESEND_API_KEY is set)

### 12. Coupon Expiry Reminders
- **Cron**: `POST /api/v1/cron/coupon-expiry-reminders` (auth: `x-cron-secret` or `?secret=CRON_SECRET`)
- Sends email for active coupons expiring within 48 hours
- **Schema**: `coupon_reminder_sent` table to avoid duplicate emails
- **Env**: `CRON_SECRET` (or `SEED_SECRET`)

### 13. Toast Notifications
- **ToastContext**: `useToast()` → `toast(message, 'success'|'error'|'info')`
- Used in referral copy, admin plans

### 14. Error Boundary
- **ErrorBoundary**: Catches React errors, shows fallback with "Try again" button
- Wraps layout content

### 15. Loading Skeletons
- **CardSkeleton**: Animated placeholder for hotel cards
- Used on hotels list while loading

### 16. Hotel Dashboard Chart
- **API**: `GET /hotel/chart?days=7` – redemptions per day
- **UI**: Bar chart of last 7 days on hotel dashboard

### 17. Admin Subscription Plan Management
- **Routes**: GET/POST /admin/plans, PUT/DELETE /admin/plans/:id
- **UI**: `/admin/plans` – create, edit, delete plans (name, coupons, price, stripe_price_id)
