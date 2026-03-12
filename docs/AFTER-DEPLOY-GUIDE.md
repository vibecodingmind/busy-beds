# After Deploy – Step-by-Step Guide

Use this guide **after** you have pushed your code and Railway + Vercel have finished building.

---

## 1. Database (new tables for reminders)

**What it is:** The app now uses two new tables: `coupon_reminder_preferences` (user opts in to “remind me 1 day before”) and `coupon_reminder_1d_sent` (so we don’t send the same 1-day reminder twice).

**What you need to do:**

### Option A: Schema runs automatically on deploy (Railway)

- If your Railway backend is set to run `schema.init.sql` (or similar) on every deploy, **you don’t need to do anything** for the database.
- To confirm: after deploy, use the app: go to **My Coupons**, open a coupon, and turn on **“Remind me 1 day before”**. If it saves without error, the new tables exist.

### Option B: Schema does NOT run automatically

You must run the new SQL once against your **production** database (the one Railway uses).

1. **Get your production database URL**
   - In Railway: open your project → your **PostgreSQL** service → **Connect** (or **Variables**).
   - Copy the **connection URL** (e.g. `postgresql://user:pass@host:port/railway`).  
     Use the **public** URL if you run the script from your own computer.

2. **Run the schema script**
   - **Option 1 – psql (if you have it installed):**
     ```bash
     cd backend
     psql "YOUR_RAILWAY_DATABASE_URL" -f scripts/schema.init.sql
     ```
   - **Option 2 – Railway dashboard or a DB client (TablePlus, pgAdmin, etc.):**
     - Open Railway → your PostgreSQL service → **Data** (or connect with your client using the same URL).
     - Open `backend/scripts/schema.init.sql` in your code editor.
     - Copy the **whole file** and run it in the SQL console (it uses `IF NOT EXISTS`, so it’s safe to run more than once).
     - Or copy only the blocks that create `coupon_reminder_preferences` and `coupon_reminder_1d_sent` and run those.

3. **Check**
   - Again: in the app, **My Coupons** → open a coupon → toggle **“Remind me 1 day before”**. If it works, you’re done.

---

## 2. Cron (optional – scheduled tasks)

**What it is:** Three HTTP endpoints that should be called on a schedule:

| What it does | Endpoint | Suggested schedule |
|--------------|----------|--------------------|
| Send “your coupon expires in 48 hours” emails | `POST /api/v1/cron/coupon-expiry-reminders` | Once per day (e.g. 9:00) |
| Send “remind me 1 day before” emails (for users who opted in) | `POST /api/v1/cron/coupon-expiry-reminders-1d` | Once per day (e.g. 9:00) |
| Email you a weekly summary (signups, redemptions, etc.) | `POST /api/v1/cron/weekly-report` | Once per week (e.g. Monday 9:00) |

**What you need to do:**

1. **Get your API URL and cron secret**
   - **API URL:** Your backend base URL, e.g. `https://api.busybeds.com` (no `/api/v1` at the end).
   - **Cron secret:** In Railway → your **backend** service → **Variables**. Find `CRON_SECRET` (or `SEED_SECRET`). Copy it. If it’s not set, add a random string (e.g. from [randomkeygen.com](https://randomkeygen.com)).

2. **Choose a cron service** (one of these):
   - **cron-job.org** (free): https://cron-job.org  
   - **Railway Cron** (if you use it): add a cron job in your Railway project.  
   - **Uptime Robot / similar:** can do HTTP GET; for POST you may need a service that supports POST.

3. **Create the cron jobs**

   **Example for cron-job.org:**

   - Sign up / log in.
   - Create a new cron job for **48h reminders**:
     - **URL:** `https://api.busybeds.com/api/v1/cron/coupon-expiry-reminders`
     - **Method:** POST
     - **Schedule:** Daily at 9:00 (or your preferred time).
     - **Request headers:**  
       `x-cron-secret` = your `CRON_SECRET` value  
       (or use query: `?secret=YOUR_CRON_SECRET` in the URL if your tool doesn’t support headers.)
   - Create a second job for **1-day reminders**:
     - **URL:** `https://api.busybeds.com/api/v1/cron/coupon-expiry-reminders-1d`
     - Same method, headers (or `?secret=`), and schedule.
   - Create a third for **weekly report**:
     - **URL:** `https://api.busybeds.com/api/v1/cron/weekly-report`
     - Same method and secret; schedule: once per week (e.g. Monday 9:00).

4. **Weekly report email**
   - In **Admin → Settings**, set **Support / contact email** to the address that should receive the weekly report. The backend sends the report to that email.

**If you skip cron:** The rest of the app still works. Users just won’t get reminder emails, and you won’t get the weekly summary email.

---

## 3. Maintenance mode

**What it is:** A setting that, when **on**, shows “We’ll be back soon” to everyone except admins (and status page).

**What you need to do:**

1. Log in as **admin** at your site (e.g. https://busybeds.com/login).
2. Go to **Admin → Settings**.
3. Find **“Maintenance mode”** (under Operations).
4. Leave it **off** (empty or `false`) for normal operation.
5. Turn it **on** (`true`) only when you want to put the site in maintenance (e.g. during a big update). When you’re done, turn it back **off**.

No other steps needed for maintenance mode.

---

## Quick checklist

- [ ] **Database:** Either schema runs on deploy, or I ran the new SQL once. “Remind me 1 day before” works in My Coupons.
- [ ] **Cron (optional):** I created the 3 cron jobs with my API URL and `CRON_SECRET`. Weekly report goes to Support email in Admin → Settings.
- [ ] **Maintenance:** Admin → Settings → Maintenance mode is **off** so the site is live.

If you’re unsure about your Railway setup (e.g. whether schema runs on deploy), say how you usually run SQL (e.g. “I only use Railway dashboard”) and we can adapt the database steps to that.
