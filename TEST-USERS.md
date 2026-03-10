# Busy Beds – Test User Accounts

Use these accounts for local development and staging. **Change passwords in production.**

## Guest / Traveler

| Email | Password | Use |
|-------|----------|-----|
| guest@busybeds.com | guest123 | Browse hotels, subscribe, generate coupons |

## Admin

| Email | Password | Use |
|-------|----------|-----|
| admin@busybeds.com | admin123 | Manage hotels, approve hotel owners, view coupons |

## Hotel Owner

| Email | Password | Hotel | Use |
|-------|----------|-------|-----|
| hotel@busybeds.com | hotel123 | Grand Plaza Hotel | Redeem coupons, view redemptions |

---

## Setup

**Option 1 – Full setup (migrate + seed + test users):**
```bash
cd backend
DATABASE_URL=your_url npm run seed:all
```

**Option 2 – Test users only (after migrate + seed):**
```bash
cd backend
DATABASE_URL=your_url npm run seed:test-users
```

**With Railway:** `railway run npm run seed:all`
