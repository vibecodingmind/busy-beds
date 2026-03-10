# Remaining Features to Add – Busy Beds

Features that could be implemented next. Not prioritized.

## Referral & Stripe Connect
- Admin retry for failed referral transfers (`status=failed`)
- Retry pending rewards when referrer connects Stripe
- `STRIPE_CONNECT_ENABLED` feature flag
- **Deploy checklist:** Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` on Railway for referral payouts

## Referral Page
- Payout history with date and transfer ID
- Filter rewards by status (paid / pending / failed)

## PWA
- Add `icon-192.png` and `icon-512.png` (run `npm run generate-icons` in frontend)

## i18n
- French locale (`fr.json`)
- Extend translations to more strings

## Email
- Password reset flow (verify implementation)
- Coupon expiry reminders cron (requires `CRON_SECRET`)

## Admin
- Admin panel for managing referral rewards (view, retry failed)
- Bulk operations for plans/hotels

## UX & Polish
- Error boundaries on more pages
- Loading skeletons for additional views
- Rate limiting on auth endpoints
- SEO improvements (meta tags, sitemap)

## Other
- Analytics / tracking for key events
- Export user data (GDPR)
- Two-factor authentication
- Hotel photos/media gallery
- Search/filter for hotels (location, rating, price)
