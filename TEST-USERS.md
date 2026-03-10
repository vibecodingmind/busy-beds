# Busy Beds – Test User Accounts

Use these accounts for local development and staging. **Change passwords in production.**

**Tip:** If login fails, re-run the seed to reset passwords and subscriptions (replace existing test users).

## Guest / Traveler (with Basic subscription – can generate coupons)

| Email | Password | Use |
|-------|----------|-----|
| guest@busybeds.com | Guest123! | Full demo – browse, generate coupons |
| demo@busybeds.com | Demo123! | Alternative guest – same as above |

## Admin

| Email | Password | Use |
|-------|----------|-----|
| admin@busybeds.com | Admin123! | Manage hotels, approve hotel owners, view coupons |

## Hotel Owner

| Email | Password | Hotel | Use |
|-------|----------|-------|-----|
| hotel@busybeds.com | Hotel123! | Grand Plaza Hotel | Redeem coupons, view redemptions |

---

## Prerequisites

1. **PostgreSQL** running locally or via Railway/Docker
2. **Create database** (if using local Postgres):
   ```bash
   createdb busybeds
   ```
3. **Set DATABASE_URL** (e.g. in `backend/.env`):
   ```
   DATABASE_URL=postgresql://localhost:5432/busybeds
   ```

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
