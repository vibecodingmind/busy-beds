import { Resend } from 'resend';
import { getSetting } from './settings';
import { config } from '../config';

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = await getSetting('resend_api_key');
  const from = (await getSetting('email_from')) || 'Busy Beds <onboarding@resend.dev>';
  if (!apiKey) return false;
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({ from, to, subject, html });
    return true;
  } catch (err) {
    console.error('Email send error:', err);
    return false;
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  const baseUrl = (await getSetting('frontend_url')) || config.frontendUrl || 'https://busybeds.com';
  const siteName = (await getSetting('site_name')) || 'Busy Beds';
  return sendEmail(
    to,
    `Welcome to ${siteName}`,
    `<h1>Welcome, ${name}!</h1><p>Thanks for joining ${siteName}. Subscribe to a plan to start generating hotel discount coupons.</p><p><a href="${baseUrl}/subscription">Choose a plan</a></p>`
  );
}

export async function sendHotelApprovalEmail(to: string, hotelName: string): Promise<boolean> {
  const baseUrl = (await getSetting('frontend_url')) || config.frontendUrl || 'https://busybeds.com';
  const siteName = (await getSetting('site_name')) || 'Busy Beds';
  return sendEmail(
    to,
    'Your hotel account has been approved',
    `<h1>Account approved</h1><p>Your hotel account for <strong>${hotelName}</strong> has been approved. You can now log in and redeem coupons.</p><p><a href="${baseUrl}/hotel/login">Hotel Login</a></p><p>— ${siteName}</p>`
  );
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  const siteName = (await getSetting('site_name')) || 'Busy Beds';
  return sendEmail(
    to,
    `Reset your ${siteName} password`,
    `<h1>Password reset</h1><p>Click the link below to reset your password. It expires in 1 hour.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you didn't request this, you can ignore this email.</p><p>— ${siteName}</p>`
  );
}

export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<boolean> {
  const siteName = (await getSetting('site_name')) || 'Busy Beds';
  return sendEmail(
    to,
    `Verify your email for ${siteName}`,
    `<h1>Verify your email</h1><p>Click the link below to verify your email address. It expires in 24 hours.</p><p><a href="${verifyUrl}">Verify email</a></p><p>If you didn't create an account, you can ignore this email.</p><p>— ${siteName}</p>`
  );
}

export async function sendCouponExpiryReminder(to: string, userName: string, hotelName: string, code: string, expiresAt: string): Promise<boolean> {
  const siteName = (await getSetting('site_name')) || 'Busy Beds';
  return sendEmail(
    to,
    `Your coupon for ${hotelName} expires soon`,
    `<h1>Coupon expiring</h1><p>Hi ${userName},</p><p>Your discount coupon (${code}) for ${hotelName} expires on ${expiresAt}. Use it before it's too late!</p><p>— ${siteName}</p>`
  );
}

export async function sendContactFormEmail(
  to: string,
  fromName: string,
  fromEmail: string,
  message: string
): Promise<boolean> {
  const siteName = (await getSetting('site_name')) || 'Busy Beds';
  const subject = `Contact form: ${siteName} — from ${fromName}`;
  const html = `
    <h2>New contact form submission</h2>
    <p><strong>From:</strong> ${fromName} &lt;${fromEmail}&gt;</p>
    <p><strong>Message:</strong></p>
    <p>${message.replace(/\n/g, '<br>')}</p>
    <hr>
    <p><em>— ${siteName} contact form</em></p>
  `;
  return sendEmail(to, subject, html);
}

export async function sendAdminWeeklyReport(
  to: string,
  data: { newSignups: number; redemptions: number; activeSubscriptions: number; totalUsers: number }
): Promise<boolean> {
  const siteName = (await getSetting('site_name')) || 'Busy Beds';
  const subject = `${siteName} – Weekly report`;
  const html = `
    <h2>Weekly report</h2>
    <p><strong>New signups (last 7 days):</strong> ${data.newSignups}</p>
    <p><strong>Redemptions (last 7 days):</strong> ${data.redemptions}</p>
    <p><strong>Active subscriptions:</strong> ${data.activeSubscriptions}</p>
    <p><strong>Total users:</strong> ${data.totalUsers}</p>
    <p>— ${siteName}</p>
  `;
  return sendEmail(to, subject, html);
}
