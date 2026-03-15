import { pool } from '../config/db';

const ENV_MAP: Record<string, string> = {
  stripe_publishable_key: 'STRIPE_PUBLISHABLE_KEY',
  stripe_secret_key: 'STRIPE_SECRET_KEY',
  stripe_webhook_secret: 'STRIPE_WEBHOOK_SECRET',
  paypal_client_id: 'PAYPAL_CLIENT_ID',
  paypal_client_secret: 'PAYPAL_CLIENT_SECRET',
  paypal_sandbox: 'PAYPAL_SANDBOX',
  flutterwave_secret_key: 'FLUTTERWAVE_SECRET_KEY',
  flutterwave_public_key: 'FLUTTERWAVE_PUBLIC_KEY',
  flutterwave_secret_hash: 'FLUTTERWAVE_SECRET_HASH',
  google_maps_api_key: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  google_client_id: 'GOOGLE_CLIENT_ID',
  google_client_secret: 'GOOGLE_CLIENT_SECRET',
  linkedin_client_id: 'LINKEDIN_CLIENT_ID',
  linkedin_client_secret: 'LINKEDIN_CLIENT_SECRET',
  resend_api_key: 'RESEND_API_KEY',
  email_from: 'EMAIL_FROM',
  site_name: 'SITE_NAME',
  support_email: 'SUPPORT_EMAIL',
  terms_url: 'TERMS_URL',
  privacy_url: 'PRIVACY_URL',
  frontend_url: 'FRONTEND_URL',
  api_url: 'API_URL',
  referral_percent: 'REFERRAL_PERCENT',
  withdraw_min_amount: 'WITHDRAW_MIN_AMOUNT',
  withdraw_max_amount: 'WITHDRAW_MAX_AMOUNT',
  cron_secret: 'CRON_SECRET',
  feature_gift_subscriptions: 'FEATURE_GIFT_SUBSCRIPTIONS',
  maintenance_mode: 'MAINTENANCE_MODE',
  whatsapp_access_token: 'WHATSAPP_ACCESS_TOKEN',
  whatsapp_phone_number_id: 'WHATSAPP_PHONE_NUMBER_ID',
  whatsapp_template_name: 'WHATSAPP_TEMPLATE_NAME',
  enable_whatsapp_reminders: 'ENABLE_WHATSAPP_REMINDERS',
};

// Only keys listed here are shown and editable in Admin → Settings (ENV_MAP above still used for getSetting)
export const SETTINGS_META: Record<
  string,
  { label: string; isSecret: boolean; isPublic: boolean; group: string }
> = {
  stripe_publishable_key: { label: 'Stripe Publishable Key', isSecret: false, isPublic: false, group: 'Stripe' },
  stripe_secret_key: { label: 'Stripe Secret Key', isSecret: true, isPublic: false, group: 'Stripe' },
  stripe_webhook_secret: { label: 'Stripe Webhook Secret', isSecret: true, isPublic: false, group: 'Stripe' },
  paypal_client_id: { label: 'PayPal Client ID', isSecret: false, isPublic: false, group: 'PayPal' },
  paypal_client_secret: { label: 'PayPal Client Secret', isSecret: true, isPublic: false, group: 'PayPal' },
  flutterwave_secret_key: { label: 'Flutterwave Secret Key', isSecret: true, isPublic: false, group: 'Flutterwave' },
  flutterwave_public_key: { label: 'Flutterwave Public Key', isSecret: false, isPublic: false, group: 'Flutterwave' },
  flutterwave_secret_hash: { label: 'Flutterwave Webhook Secret Hash', isSecret: true, isPublic: false, group: 'Flutterwave' },
  google_maps_api_key: { label: 'Google Maps API Key', isSecret: false, isPublic: true, group: 'Maps' },
  google_client_id: { label: 'Google OAuth Client ID', isSecret: false, isPublic: false, group: 'OAuth' },
  google_client_secret: { label: 'Google OAuth Client Secret', isSecret: true, isPublic: false, group: 'OAuth' },
  linkedin_client_id: { label: 'LinkedIn Client ID', isSecret: false, isPublic: false, group: 'OAuth' },
  linkedin_client_secret: { label: 'LinkedIn Client Secret', isSecret: true, isPublic: false, group: 'OAuth' },
  site_name: { label: 'Site name', isSecret: false, isPublic: true, group: 'Site' },
  support_email: { label: 'Support / contact email', isSecret: false, isPublic: true, group: 'Site' },
  referral_percent: { label: 'Referral reward percent (e.g. 25)', isSecret: false, isPublic: false, group: 'Business' },
  withdraw_min_amount: { label: 'Withdraw min amount (e.g. 10)', isSecret: false, isPublic: false, group: 'Business' },
  withdraw_max_amount: { label: 'Withdraw max amount per request (e.g. 500)', isSecret: false, isPublic: false, group: 'Business' },
  cron_secret: { label: 'Cron / seed secret', isSecret: true, isPublic: false, group: 'Security' },
  feature_gift_subscriptions: { label: 'Enable gift subscriptions (true/false)', isSecret: false, isPublic: false, group: 'Features' },
  maintenance_mode: { label: 'Maintenance mode (true = show "We\'ll be back soon" to non-admins)', isSecret: false, isPublic: true, group: 'Operations' },
  whatsapp_access_token: { label: 'WhatsApp Access Token (Meta)', isSecret: true, isPublic: false, group: 'WhatsApp' },
  whatsapp_phone_number_id: { label: 'WhatsApp Phone Number ID (Meta)', isSecret: false, isPublic: false, group: 'WhatsApp' },
  whatsapp_template_name: { label: 'WhatsApp template name (e.g. coupon_expiry_reminder)', isSecret: false, isPublic: false, group: 'WhatsApp' },
  enable_whatsapp_reminders: { label: 'Enable WhatsApp coupon reminders (true/false)', isSecret: false, isPublic: false, group: 'WhatsApp' },
};

const PUBLIC_KEYS = Object.entries(SETTINGS_META)
  .filter(([, m]) => m.isPublic)
  .map(([k]) => k);

let cache: Record<string, string | null> = {};
let cacheTs = 0;
const CACHE_TTL_MS = 60_000;

function maskSecret(value: string | null): string {
  if (!value || value.length < 8) return value ? '••••••••' : '';
  return value.slice(0, 4) + '••••••••' + value.slice(-4);
}

export async function getSetting(key: string): Promise<string | null> {
  const envVar = ENV_MAP[key];
  const envVal = envVar ? process.env[envVar] : undefined;
  if (envVal != null && envVal !== '') return envVal;

  if (Date.now() - cacheTs < CACHE_TTL_MS && key in cache) return cache[key];

  const row = await pool.query<{ value: string | null }>('SELECT value FROM settings WHERE key = $1', [key]);
  const val = row.rows[0]?.value ?? null;
  cache[key] = val;
  cacheTs = Date.now();
  return val;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await pool.query(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
    [key, value]
  );
  cache[key] = value;
}

export function invalidateCache(): void {
  cache = {};
  cacheTs = 0;
}

export async function getAllForAdmin(): Promise<
  { key: string; label: string; value: string; masked: boolean; group: string }[]
> {
  const keys = Object.keys(SETTINGS_META);

  // Fetch all DB values in a single query instead of N sequential queries
  const dbRows = await pool.query<{ key: string; value: string | null }>(
    'SELECT key, value FROM settings WHERE key = ANY($1::text[])',
    [keys]
  );
  const dbMap: Record<string, string | null> = {};
  for (const row of dbRows.rows) dbMap[row.key] = row.value;

  const result: { key: string; label: string; value: string; masked: boolean; group: string }[] = [];
  for (const key of keys) {
    const meta = SETTINGS_META[key]!;
    // Prefer env var, then DB value
    const envVar = ENV_MAP[key];
    const envVal = envVar ? process.env[envVar] : undefined;
    const raw = (envVal != null && envVal !== '') ? envVal : (dbMap[key] ?? null);
    const value = meta.isSecret ? maskSecret(raw ?? '') : (raw ?? '');
    result.push({ key, label: meta.label, value, masked: meta.isSecret, group: meta.group });
  }
  return result;
}

export async function getPublicSettings(): Promise<Record<string, string>> {
  // Fetch all public keys in a single query
  const dbRows = await pool.query<{ key: string; value: string | null }>(
    'SELECT key, value FROM settings WHERE key = ANY($1::text[])',
    [PUBLIC_KEYS]
  );
  const dbMap: Record<string, string | null> = {};
  for (const row of dbRows.rows) dbMap[row.key] = row.value;

  const out: Record<string, string> = {};
  for (const key of PUBLIC_KEYS) {
    const envVar = ENV_MAP[key];
    const envVal = envVar ? process.env[envVar] : undefined;
    const v = (envVal != null && envVal !== '') ? envVal : (dbMap[key] ?? null);
    if (v) out[key] = v;
  }
  return out;
}

export async function updateSettings(updates: Record<string, unknown>): Promise<void> {
  for (const [key, value] of Object.entries(updates)) {
    if (!SETTINGS_META[key]) continue;
    const strVal = value == null ? '' : String(value).trim();
    if (strVal === '') {
      await pool.query('DELETE FROM settings WHERE key = $1', [key]);
      cache[key] = null;
    } else {
      await setSetting(key, strVal);
    }
  }
  invalidateCache();
}

// Page content keys (privacy, terms, about, contact details) — editable in Admin → Pages
const PAGE_KEYS = ['page_privacy', 'page_terms', 'page_about', 'contact_phone', 'contact_address'] as const;

export async function getPageContent(slug: string): Promise<string | null> {
  const map: Record<string, string> = {
    privacy: 'page_privacy',
    terms: 'page_terms',
    about: 'page_about',
  };
  const key = map[slug];
  if (!key) return null;
  return getSetting(key);
}

export async function getContactDetails(): Promise<{
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
}> {
  const [contactEmail, contactPhone, contactAddress] = await Promise.all([
    getSetting('support_email'),
    getSetting('contact_phone'),
    getSetting('contact_address'),
  ]);
  return { contactEmail, contactPhone, contactAddress };
}

export async function getAllPagesForAdmin(): Promise<{
  page_privacy: string;
  page_terms: string;
  page_about: string;
  contact_phone: string;
  contact_address: string;
}> {
  const [page_privacy, page_terms, page_about, contact_phone, contact_address] = await Promise.all(
    PAGE_KEYS.map((k) => getSetting(k))
  );
  return {
    page_privacy: page_privacy ?? '',
    page_terms: page_terms ?? '',
    page_about: page_about ?? '',
    contact_phone: contact_phone ?? '',
    contact_address: contact_address ?? '',
  };
}

export async function updatePageContent(updates: Record<string, unknown>): Promise<void> {
  for (const key of PAGE_KEYS) {
    const value = updates[key];
    if (value === undefined) continue;
    const strVal = value == null ? '' : String(value).trim();
    if (strVal === '') {
      await pool.query('DELETE FROM settings WHERE key = $1', [key]);
      cache[key] = null;
    } else {
      await setSetting(key, strVal);
    }
  }
  invalidateCache();
}
