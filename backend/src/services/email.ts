import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.EMAIL_FROM || 'Busy Beds <onboarding@resend.dev>';

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!resend) return false;
  try {
    await resend.emails.send({ from, to, subject, html });
    return true;
  } catch (err) {
    console.error('Email send error:', err);
    return false;
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  return sendEmail(
    to,
    'Welcome to Busy Beds',
    `<h1>Welcome, ${name}!</h1><p>Thanks for joining Busy Beds. Subscribe to a plan to start generating hotel discount coupons.</p><p><a href="${process.env.FRONTEND_URL || 'https://busybeds.com'}/subscription">Choose a plan</a></p>`
  );
}

export async function sendHotelApprovalEmail(to: string, hotelName: string): Promise<boolean> {
  return sendEmail(
    to,
    'Your hotel account has been approved',
    `<h1>Account approved</h1><p>Your hotel account for <strong>${hotelName}</strong> has been approved. You can now log in and redeem coupons.</p><p><a href="${process.env.FRONTEND_URL || 'https://busybeds.com'}/hotel/login">Hotel Login</a></p>`
  );
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  return sendEmail(
    to,
    'Reset your Busy Beds password',
    `<h1>Password reset</h1><p>Click the link below to reset your password. It expires in 1 hour.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you didn't request this, you can ignore this email.</p>`
  );
}

export async function sendCouponExpiryReminder(to: string, userName: string, hotelName: string, code: string, expiresAt: string): Promise<boolean> {
  return sendEmail(
    to,
    `Your coupon for ${hotelName} expires soon`,
    `<h1>Coupon expiring</h1><p>Hi ${userName},</p><p>Your discount coupon (${code}) for ${hotelName} expires on ${expiresAt}. Use it before it's too late!</p>`
  );
}
