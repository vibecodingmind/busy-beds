# Busy Beds — Deployment Plan

## Current Setup

The project is already deployed with:
- **Backend:** Railway (auto-deploys on push to `main`)
- **Frontend:** Vercel (auto-deploys on push to `main`)
- **Database:** Railway PostgreSQL

## Deployment Steps

### Option 1: Automatic Deploy (Recommended)

Since Railway and Vercel are already connected with auto-deploy:

```bash
# Commit all changes
git add -A
git commit -m "Fix: critical security & performance improvements

Phase 1 - Security:
- Fix CORS vulnerability (reject unknown origins)
- Require JWT_SECRET in production
- Fix settings cache bug
- Remove duplicate PostgreSQL pool
- Invalidate tokens on password reset + transactions
- Escape HTML in email templates
- Return validation error details

Phase 2 - Performance:
- Fix N+1 settings queries (single query)
- Fix N+4 correlated subqueries (CTEs)
- Configure PostgreSQL pool limits
- Add search debouncing (300ms)
- Remove redundant admin dashboard fetches

Phase 3 - Testing & CI:
- Add vitest with 10 tests
- Add GitHub Actions CI pipeline
- Add ESLint/Prettier to backend

Phase 4 - UX:
- Consolidate brand colors to Tailwind tokens
- Fix admin dashboard dark mode
- Replace alert() with toast notifications
- Add Next.js middleware for route protection
- Fix nested button accessibility issue"

# Push to main - triggers both Railway + Vercel auto-deploy
git push origin main
```

### Option 2: Manual Deploy via CLI

If you want more control:

**Backend (Railway):**
```bash
# Install Railway CLI if needed
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy backend
railway up --service backend
```

**Frontend:**
Vercel auto-deploys on push — no CLI needed.

## Verify Deployment

After deployment completes (5-10 minutes):

1. **Check Railway logs:**
   - Go to Railway Dashboard → busy-beds → Deployments
   - Verify the deploy succeeded with no errors
   - Check logs for any runtime errors

2. **Test the API:**
   ```bash
   # Your Railway backend URL
   curl https://your-backend.up.railway.app/health
   # Should return: {"status":"ok","database":"ok"...}
   ```

3. **Test the frontend:**
   - Visit your Vercel URL
   - Check console for errors
   - Test a few key flows (login, hotels list)

## Environment Variables to Verify

Ensure these are set in Railway:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection |
| `JWT_SECRET` | ✅ | Must be set (new code throws if missing in prod) |
| `FRONTEND_URL` | ✅ | Your Vercel URL for CORS |
| `STRIPE_SECRET_KEY` | If using payments | |
| `STRIPE_WEBHOOK_SECRET` | If using Stripe | |

## Rollback Plan

If something breaks:

1. **Railway:** Dashboard → Deployments → Find last working deploy → Click "Redeploy"
2. **Vercel:** Dashboard → Deployments → Find last working deploy → Click "..." → "Promote to Production"

## Post-Deployment Checklist

- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Frontend loads without errors
- [ ] User login works
- [ ] Hotel listing loads (tests the N+1 fix)
- [ ] Search debouncing works (no rapid API calls)
- [ ] Admin dashboard loads (tests analytics + dark mode)
- [ ] No CORS errors in browser console

## New Features Available

After deploying, you have:
- GitHub Actions CI (runs lint/type-check/test on every PR)
- 10 unit tests (run via `npm test` in backend)
- ESLint + Prettier for backend (`npm run lint`, `npm run format`)
- Edge middleware protecting admin/user routes
