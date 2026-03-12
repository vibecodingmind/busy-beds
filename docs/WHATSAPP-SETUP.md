# WhatsApp (Meta Cloud API) setup

Busy Beds can send coupon expiry reminders via WhatsApp in addition to email. This uses **Meta WhatsApp Cloud API** directly (no Twilio or other BSP). You only pay Meta’s per-conversation/message fees.

## 1. Meta for Developers

1. Go to [developers.facebook.com](https://developers.facebook.com) and create or select an app.
2. Add the **WhatsApp** product to your app.
3. In WhatsApp → **API Setup** you’ll see:
   - **Phone number ID** – copy this; you’ll set it in Admin as **WhatsApp Phone Number ID**.
   - A temporary **Access token** for testing. For production, use a **System User** token or long-lived token.

### Long-lived token (recommended for production)

- In Meta Business Suite: **Business Settings** → **Users** → **System users** → create one (e.g. “Busy Beds server”) and assign it to your app with **WhatsApp Management**.
- Generate a token for that system user with `whatsapp_business_messaging` and `whatsapp_business_management`.
- Use this token in Admin as **WhatsApp Access Token** (store it as a secret).

## 2. Message template (required)

You can only start a conversation or send a message after 24h inactivity with an **approved template**.

Meta requires variable placeholders to use **lowercase letters, underscores, and numbers** with **double curly brackets**, e.g. `{{user_name}}`, `{{order_id}}`. Do not use `{{1}}`, `{{2}}` or single curly brackets.

1. In your app: **WhatsApp** → **Message templates** → **Create template**.
2. Create a template, for example:
   - **Name:** `coupon_expiry_reminder` (must match exactly what you set in Admin).
   - **Category:** Utility (or Marketing).
   - **Body** (use this exact placeholder format):
     ```
     Hi {{user_name}}, your coupon for {{hotel_name}} (code: {{code}}) expires on {{expiry_date}}. Use it soon! - {{site_name}}
     ```
   - Add 5 **body variables** in this order: `user_name`, `hotel_name`, `code`, `expiry_date`, `site_name`. The app sends values in this same order.
3. Submit for approval. Once approved, the app can send this template.

## 3. Admin settings

In **Admin** → **Settings**, set:

| Setting | Description |
|--------|-------------|
| **WhatsApp Access Token** | Meta access token (secret). |
| **WhatsApp Phone Number ID** | From WhatsApp API Setup. |
| **WhatsApp template name** | e.g. `coupon_expiry_reminder` (must match the template name in Meta). |
| **Enable WhatsApp reminders** | Set to `true` to send WhatsApp in addition to email. |

Optionally set **Site name**; it’s used as the 5th template parameter.

## 4. User phone and opt-in

- Users add their **phone number** on **Account** (profile). The app normalizes it (digits only; 9-digit numbers are assumed to be Tanzania and get a `255` prefix).
- Users must check **“Receive coupon reminders on WhatsApp”** on their profile. Reminders are only sent when this is enabled and a phone number is present.

## 5. Cron (reminder jobs)

The same cron jobs that send **email** reminders also send **WhatsApp** when:

- **Enable WhatsApp reminders** is `true`,
- The user has a phone number and **whatsapp_opt_in** is true.

No extra cron endpoints are needed. Use your existing reminder cron:

- `POST /api/v1/cron/coupon-expiry-reminders` (48h)
- `POST /api/v1/cron/coupon-expiry-reminders-1d` (1-day opt-in)

## 6. Phone normalization

- Stored value can include spaces/dashes; the backend strips non-digits for sending.
- If the number has **9 digits** and no country code, it is treated as Tanzania (`255` + digits). For other default country codes you’d need a backend change.

## Troubleshooting

- **“Template not found”** – Template name in Admin must match exactly the name in Meta (case-sensitive).
- **“Invalid phone number”** – Ensure the number is in E.164-like form (e.g. 255712345678 for Tanzania). The app adds 255 for 9-digit numbers.
- **No WhatsApp sent** – Check that **Enable WhatsApp reminders** is `true`, and that the user has a phone number and has opted in on their profile.
