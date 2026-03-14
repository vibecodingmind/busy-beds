# Deploy All Implemented Features — Plan

## Goal
Merge the unmerged MediaItem/gallery feature branch into `main` and push to trigger auto-deploy on Railway (backend) and Vercel (frontend).

## Current State
- `main` is at `9717cc4 fix: resolve TypeScript build errors for deployment`
- Branch `origin/session/agent_a2040697` has 1 unmerged commit: `262c5fe feat(hotels): support MediaItem for hotel images and galleries`
- Branch `origin/session/agent_a29cf9bb` ("wip") is **skipped** — it removes auth middleware (security regression)

## Steps

### 1. Checkout `main` and merge the feature branch
```bash
git checkout main
git merge origin/session/agent_a2040697-09fc-427d-9e60-46dd8443e417 --no-edit
```
This brings in:
- `MediaItem` type support for hotel images (backward-compatible `string[] | MediaItem[]`)
- `BlurImage` lazy-loading component with blur-up transitions
- Video support in photo gallery lightbox
- Category tabs to filter gallery images
- Touch/swipe gestures for mobile gallery navigation
- Slideshow auto-play in lightbox
- Zoom on click/double-tap in lightbox
- Admin form normalization (`MediaItem[]` → `string[]`)

Files changed (frontend only, 5 files):
- `frontend/src/lib/api.ts`
- `frontend/src/components/hotel/HotelCard.tsx`
- `frontend/src/components/hotel/HotelPhotoGallery.tsx`
- `frontend/src/components/hotel/PropertyListPanel.tsx`
- `frontend/src/app/admin/hotels/[id]/page.tsx`

### 2. Verify the build succeeds
```bash
# Backend build
cd backend && npm run build

# Frontend build (if possible — needs NEXT_PUBLIC_API_URL)
cd frontend && npm run build
```

### 3. Push `main` to origin
```bash
git push origin main
```
This triggers:
- **Railway**: auto-deploys backend (detects push to `main`)
- **Vercel**: auto-deploys frontend (detects push to `main`)

### 4. Post-deploy verification
- Check Railway Dashboard → Deployments tab for successful build
- Check Vercel Dashboard → Deployments tab for successful build
- Test backend health endpoint
- Test frontend loads and gallery features work

## Risk Assessment
- **Low risk** — the merge is frontend-only, backward-compatible, no backend changes
- No merge conflicts expected (confirmed: disjoint file sets)
- No security implications (auth middleware untouched)

## What is NOT being deployed (and why)
- Branch `agent_a29cf9bb` ("wip"): Deletes `middleware.ts` auth guards and replaces with dead code (`proxy.ts`). This is a security regression and unfinished work. Skipped intentionally.
