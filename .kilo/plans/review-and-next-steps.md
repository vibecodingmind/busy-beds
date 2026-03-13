# Busy Beds — Project Review & Next Steps Plan

## Project Summary

**Busy Beds** is a Hotel Coupon Membership SaaS — travelers subscribe (Basic/Standard/Premium), browse participating hotels, generate unique QR-code discount coupons, and redeem them at hotel check-in. Hotels have their own portal to scan/redeem coupons. Admins manage everything.

- **Frontend:** Next.js 16 + React 19 + TailwindCSS + TypeScript → **Vercel**
- **Backend:** Express.js + TypeScript + raw SQL (pg) → **Railway**
- **Database:** PostgreSQL → **Railway**

The project has a rich feature set: multi-payment (Stripe, PayPal, Flutterwave), OAuth (Google/Facebook/LinkedIn), JWT auth with refresh tokens, referral program with payouts, reviews/ratings, i18n (EN/ES/FR), dark mode, PWA support, WhatsApp notifications, admin CMS, and more.

---

## PART 1: CRITICAL FIXES (Do These First)

### 1.1 — CORS Allows All Origins (Security Vulnerability)

**File:** `backend/src/index.ts:46`

The CORS callback falls back to `allowed[0] || true` instead of rejecting unknown origins. This means **any website** can make authenticated cross-origin requests to the API.

**Fix:** Replace `cb(null, allowed[0] || true)` with `cb(new Error('Not allowed by CORS'))`.

---

### 1.2 — Weak Default JWT Secret

**File:** `backend/src/config/index.ts:13`

The server silently starts with `'dev-secret-change-in-production'` if `JWT_SECRET` is not set. An attacker who knows this string can forge JWTs for any user/admin.

**Fix:** Throw an error at startup if `JWT_SECRET` is not set in production (`NODE_ENV === 'production'`).

---

### 1.3 — Settings Cache Never Works (Performance Bug)

**File:** `backend/src/services/settings.ts:78-97`

`cacheTs` is initialized to `0` and **never updated after a DB read**. The TTL check `Date.now() - 0 > 60000` is always true, so every `getSetting()` call hits the database (used on nearly every request for maintenance mode check, etc.).

**Fix:** Add `cacheTs = Date.now()` after the successful DB read.

---

### 1.4 — Duplicate PostgreSQL Pool (Connection Leak)

**File:** `backend/src/routes/auth.ts:19`

A second `new Pool(...)` is created in the auth routes file instead of importing the shared pool from `config/db.ts`. This leaks connections.

**Fix:** Remove the duplicate pool; import from `../config/db`.

---

### 1.5 — Password Reset Does Not Invalidate Sessions

**File:** `backend/src/routes/auth.ts:234-237`

After a password reset, existing JWTs remain valid. If a password was compromised, the attacker retains access.

**Fix:** Increment `token_version` after password reset to invalidate all existing tokens.

---

### 1.6 — Multi-Step DB Operations Without Transactions

**Files:** `backend/src/routes/auth.ts` (password reset, email verification)

Password reset runs two queries sequentially (UPDATE password + DELETE token) without a transaction. A crash between them leaves the reset token reusable.

**Fix:** Wrap in `BEGIN`/`COMMIT` transactions.

---

### 1.7 — HTML Injection in Email Templates

**File:** `backend/src/services/email.ts:74-82`

User-supplied `fromName`, `fromEmail`, and `message` are interpolated directly into HTML email templates without escaping. A malicious user can inject arbitrary HTML/JS into admin-facing emails.

**Fix:** HTML-escape all user inputs before interpolation (`&`, `<`, `>`, `"`, `'`).

---

### 1.8 — Validation Errors Are Silent

**File:** `backend/src/middleware/validation.ts:11-18`

The validation middleware builds an `errorMessages` array but never includes it in the response. Clients only receive `{ error: 'Validation failed' }` with no field-level details.

**Fix:** Return `{ error: 'Validation failed', details: errorMessages }`.

---

## PART 2: HIGH-PRIORITY IMPROVEMENTS

### 2.1 — Add Test Framework & Tests

There are **zero tests** in the entire project. No `jest`, `vitest`, or `playwright` configuration exists.

**Recommendation:**
- Add `vitest` for backend unit/integration tests
- Add `@testing-library/react` + `vitest` for frontend component tests
- Priority test targets: coupon generation/redemption logic, JWT auth middleware, Stripe webhook handling, rate limiting
- Add a CI step (GitHub Actions) that runs tests on PR

---

### 2.2 — Add Next.js Middleware for Route Protection

**File:** Frontend has no `middleware.ts`

Admin pages are only protected by a client-side `useEffect` redirect. The full admin JS bundle is already delivered before the redirect fires.

**Recommendation:** Create `frontend/src/middleware.ts` that checks for a valid auth token cookie/header and redirects unauthenticated users at the edge for `/admin/*`, `/dashboard`, `/my-coupons`, `/profile`, etc.

---

### 2.3 — Fix N+1 Settings Queries on Admin Page

**File:** `backend/src/services/settings.ts:114-126`

`getAllForAdmin()` runs ~38 sequential DB queries (one per setting key).

**Fix:** Replace with a single `SELECT key, value FROM settings WHERE key = ANY($1::text[])`.

---

### 2.4 — Fix N+4 Correlated Subqueries in Hotel Listing

**File:** `backend/src/models/hotel.ts:72-82`

Each hotel row triggers 4 correlated subqueries (avg_rating, review_count, redemptions, avg_response_hours). For 50 hotels = 200 extra subquery executions.

**Fix:** Replace with LEFT JOINs or CTEs.

---

### 2.5 — Add Search Debouncing

**File:** `frontend/src/app/hotels/HotelsClient.tsx:40-42`

Every keystroke fires an API request. Typing "Grand Plaza" sends 11 requests.

**Fix:** Add a `useDebounce` hook with ~300ms delay on the `search` state.

---

### 2.6 — Admin Dashboard Fetches Full Collections for Counts

**File:** `frontend/src/app/admin/page.tsx:28-44`

Downloads all hotels, users, coupons just to call `.length`. The analytics endpoint already provides these counts.

**Fix:** Use only the `/admin/analytics` response for counts; remove the 4 redundant API calls.

---

### 2.7 — Configure PostgreSQL Pool Limits

**File:** `backend/src/config/db.ts`

The pool has no `max`, `idleTimeoutMillis`, or `connectionTimeoutMillis`. Under load it can exhaust database connections.

**Fix:** Add `{ max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 }`.

---

### 2.8 — Consolidate Brand Colors into Tailwind Tokens

~15 files hardcode `#FF385C` / `#e31c5f`. A rebrand requires sweeping find-replace.

**Fix:** Define `brand` color in Tailwind config, use `bg-brand`, `text-brand`, `hover:bg-brand-dark` everywhere.

---

### 2.9 — Replace `alert()` with Toast Notifications

**File:** `frontend/src/app/hotels/HotelsClient.tsx:58, 66`

Native `alert()` blocks the main thread and can't be styled. The project already has a `ToastContext`.

**Fix:** Replace all `alert()` calls with `toast()` from the existing toast system.

---

### 2.10 — Fix Admin Dashboard Dark Mode

**File:** `frontend/src/app/admin/page.tsx:51-75`

Text uses `text-black` without `dark:` variants — unreadable in dark mode.

**Fix:** Replace `text-black` with `text-gray-900 dark:text-gray-100`.

---

## PART 3: WHAT TO BUILD NEXT

Based on the existing `docs/REMAINING-FEATURES.md` and the current state of the codebase, here are prioritized next features:

### Priority A — Revenue & Growth

| # | Feature | Why | Effort |
|---|---------|-----|--------|
| 1 | **Stripe Connect for Referral Payouts** | The referral system tracks rewards but actual payouts are manual. Stripe Connect Express accounts automate this. | Medium |
| 2 | **Promo Code System (full flow)** | `promo_codes` table exists but the full end-to-end flow (apply at checkout, reduce first month, track usage) needs completion. | Small |
| 3 | **Hotel Self-Onboarding Portal** | Let hotels register, upload photos, set their own discount %, and manage their listing pending admin approval. Reduces admin bottleneck. | Medium |
| 4 | **Analytics Dashboard Improvements** | Revenue tracking, churn rate, coupon conversion rate (generated vs redeemed), geographic distribution, cohort analysis. | Medium |

### Priority B — User Experience & Retention

| # | Feature | Why | Effort |
|---|---------|-----|--------|
| 5 | **Push Notifications (Web Push)** | The PWA infrastructure exists but there are no push notifications for coupon expiry, new hotel deals, etc. | Medium |
| 6 | **Hotel Search by City/Location** | The `deals/[city]` route exists but the backend doesn't filter by city. Add city-based filtering + SEO landing pages. | Small |
| 7 | **User Notification Center** | In-app notification feed (coupon reminders, review responses, referral rewards, subscription changes) instead of just email. | Medium |
| 8 | **Hotel Photo Gallery Upload** | Hotels currently have JSONB image arrays (Unsplash URLs). Add proper image upload (Cloudinary or S3) for hotel photos. | Medium |
| 9 | **Two-Factor Authentication (2FA)** | TOTP-based 2FA for admin accounts at minimum. Protects against credential stuffing. | Medium |

### Priority C — Operations & Scale

| # | Feature | Why | Effort |
|---|---------|-----|--------|
| 10 | **CI/CD Pipeline (GitHub Actions)** | No CI exists. Add: lint, type-check, test, build on every PR. Deploy previews for frontend. | Small |
| 11 | **Database Migration Framework** | Currently using append-only `CREATE TABLE IF NOT EXISTS` blocks. This breaks for column renames, type changes, or data migrations. Adopt `node-pg-migrate` or `dbmate`. | Medium |
| 12 | **Monitoring & Alerting** | No APM, error tracking, or uptime monitoring. Add Sentry (error tracking), uptime monitoring (BetterStack/UptimeRobot), and Railway metrics. | Small |
| 13 | **Rate Limiting per User** | Current rate limiting is IP-based. A shared IP (corporate WiFi, VPN) could hit limits. Add user-ID-based rate limiting for authenticated endpoints. | Small |
| 14 | **Database Backups & Point-in-Time Recovery** | Railway provides backups but no documented restore procedure. Document and test the recovery process. | Small |

---

## PART 4: DOCUMENTATION IMPROVEMENTS

1. **Consolidate deployment docs** — `DEPLOYMENT.md`, `SETUP-CHECKLIST.md`, `RAILWAY-CHECK.md`, `SEED-GUIDE.md`, and 5 docs/ files overlap significantly. Merge into a single `docs/DEPLOYMENT-GUIDE.md` with clear sections.

2. **Add API documentation** — There is no API reference doc. Consider auto-generating from route definitions or adding a Swagger/OpenAPI spec.

3. **Add architecture decision records (ADRs)** — Document why decisions were made (raw SQL vs ORM, multi-payment, etc.) for future developers.

4. **Remove sensitive credentials from docs** — `docs/CREATE-ADMIN.md` contains a real email and password in plaintext. Replace with placeholders.

5. **Update `docs/REMAINING-FEATURES.md`** — Some items listed as "remaining" have already been implemented (French locale, password reset, error boundaries, loading skeletons, rate limiting). Clean up.

---

## PART 5: CODE QUALITY IMPROVEMENTS (Lower Priority)

| Issue | File(s) | Fix |
|-------|---------|-----|
| `any` types in validation middleware | `backend/src/middleware/validation.ts` | Use `ValidationChain`, `ValidationError` types |
| `asyncHandler` typed with `Function` | `backend/src/middleware/errorHandler.ts:95` | Use proper Express handler type |
| Mixed `console.error` and `logger.error` | Multiple backend routes | Standardize on Winston `logger` |
| Dead code in admin withdraw handler | `backend/src/routes/admin.ts:589-600` | Remove unused `query` variable |
| `object` return types in API client | `frontend/src/lib/api.ts:111-113` | Define proper interfaces |
| Nested `<button>` inside `<Link>` (a11y) | `frontend/src/components/hotel/HotelCard.tsx:27-88` | Position FavoriteButton outside the Link |
| `dangerouslySetInnerHTML` for theme script | `frontend/src/app/layout.tsx:47-51` | Use Next.js `Script` component |
| No ESLint/Prettier for backend | Backend root | Add `.eslintrc` + `prettier.config.js` + lint script |
| `frontendUrls` config has duplicate defaults | `backend/src/config/index.ts:17-19` | Fix comma-separated URL handling |
| Seed endpoints use GET for mutations | `backend/src/routes/seed.ts` | Change to POST |
| JWT tokens in OAuth redirect URLs | `backend/src/routes/oauth.ts` | Use short-lived exchange codes |

---

## IMPLEMENTATION ORDER (Recommended)

### Phase 1 — Critical Fixes (Week 1)
1. Fix CORS vulnerability (`backend/src/index.ts`)
2. Require JWT_SECRET at startup (`backend/src/config/index.ts`)
3. Fix settings cache bug (`backend/src/services/settings.ts`)
4. Remove duplicate Pool (`backend/src/routes/auth.ts`)
5. Add transactions to password reset / email verify
6. Invalidate tokens on password reset
7. Escape HTML in email templates
8. Return validation error details

### Phase 2 — Performance & DX (Week 2)
9. Fix N+1 settings queries
10. Fix N+4 hotel listing subqueries
11. Configure pool limits
12. Add search debouncing
13. Fix admin dashboard redundant fetches
14. Add ESLint/Prettier to backend

### Phase 3 — Testing & CI (Week 2-3)
15. Set up vitest for backend
16. Write tests for auth, coupon service, middleware
17. Set up GitHub Actions CI pipeline

### Phase 4 — UX Polish (Week 3)
18. Consolidate brand colors into Tailwind tokens
19. Fix admin dark mode
20. Replace `alert()` with toast
21. Add Next.js middleware for route protection
22. Fix accessibility (nested interactive elements)

### Phase 5 — New Features (Week 4+)
23. Complete Stripe Connect payout automation
24. Full promo code checkout flow
25. Hotel self-onboarding portal
26. Push notifications
27. Monitoring & error tracking (Sentry)
28. Database migration framework
