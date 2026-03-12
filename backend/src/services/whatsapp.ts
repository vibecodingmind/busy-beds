import { getSetting } from './settings';

const META_API_VERSION = 'v21.0';
const DEFAULT_COUNTRY_PREFIX = '255'; // Tanzania

/**
 * Normalize phone to digits only for Meta WhatsApp API.
 * If 9 digits, assume Tanzania and prepend 255.
 */
function normalizePhone(toPhone: string): string | null {
  const digits = (toPhone || '').replace(/\D/g, '');
  if (digits.length === 0) return null;
  if (digits.length === 9 && !digits.startsWith('0')) {
    return DEFAULT_COUNTRY_PREFIX + digits;
  }
  if (digits.length >= 10) return digits;
  return null;
}

/**
 * Send coupon expiry reminder via Meta WhatsApp Cloud API.
 * Requires approved template in Meta Business Manager (e.g. coupon_expiry_reminder)
 * with body params: {{1}} user name, {{2}} hotel name, {{3}} code, {{4}} expiry date, {{5}} site name.
 */
export async function sendCouponExpiryWhatsApp(
  toPhone: string,
  userName: string,
  hotelName: string,
  code: string,
  expiresAt: string
): Promise<boolean> {
  const token = await getSetting('whatsapp_access_token');
  const phoneNumberId = await getSetting('whatsapp_phone_number_id');
  const templateName = (await getSetting('whatsapp_template_name')) || 'coupon_expiry_reminder';
  const siteName = (await getSetting('site_name')) || 'Busy Beds';

  if (!token || !phoneNumberId) return false;

  const to = normalizePhone(toPhone);
  if (!to) return false;

  const url = `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: String(userName || '').slice(0, 100) },
            { type: 'text', text: String(hotelName || '').slice(0, 100) },
            { type: 'text', text: String(code || '').slice(0, 50) },
            { type: 'text', text: String(expiresAt || '').slice(0, 50) },
            { type: 'text', text: String(siteName || 'Busy Beds').slice(0, 100) },
          ],
        },
      ],
    },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[WhatsApp] Meta API error:', res.status, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[WhatsApp] send failed:', err);
    return false;
  }
}
