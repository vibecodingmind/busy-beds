import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the settings service so tests don't need a DB
vi.mock('../services/settings', () => ({
  getSetting: vi.fn(async (key: string) => {
    const map: Record<string, string> = {
      resend_api_key: 'test-key',
      email_from: 'test@busybeds.com',
      site_name: 'Test Beds',
      frontend_url: 'https://test.example.com',
    };
    return map[key] ?? null;
  }),
}));

// Mock Resend so no real emails are sent
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'test-email-id' }),
    },
  })),
}));

import { sendContactFormEmail, sendWelcomeEmail, sendCouponExpiryReminder } from '../services/email';

describe('sendContactFormEmail', () => {
  it('escapes HTML injection in fromName', async () => {
    const { Resend } = await import('resend');
    const mockSend = vi.fn().mockResolvedValue({ id: 'x' });
    (Resend as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      emails: { send: mockSend },
    }));

    await sendContactFormEmail(
      'admin@test.com',
      '<script>alert("xss")</script>',
      'attack@evil.com',
      'Hello'
    );

    const callArg = mockSend.mock.calls[0]?.[0];
    expect(callArg?.html).not.toContain('<script>');
    expect(callArg?.html).toContain('&lt;script&gt;');
  });

  it('escapes HTML injection in message body', async () => {
    const { Resend } = await import('resend');
    const mockSend = vi.fn().mockResolvedValue({ id: 'x' });
    (Resend as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      emails: { send: mockSend },
    }));

    await sendContactFormEmail(
      'admin@test.com',
      'Normal User',
      'user@test.com',
      '<img src=x onerror=alert(1)>'
    );

    const callArg = mockSend.mock.calls[0]?.[0];
    expect(callArg?.html).not.toContain('<img');
    expect(callArg?.html).toContain('&lt;img');
  });
});

describe('sendWelcomeEmail', () => {
  it('escapes HTML in user name', async () => {
    const { Resend } = await import('resend');
    const mockSend = vi.fn().mockResolvedValue({ id: 'x' });
    (Resend as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      emails: { send: mockSend },
    }));

    await sendWelcomeEmail('user@test.com', '<b>Bold</b>');

    const callArg = mockSend.mock.calls[0]?.[0];
    expect(callArg?.html).not.toContain('<b>Bold</b>');
    expect(callArg?.html).toContain('&lt;b&gt;Bold&lt;/b&gt;');
  });
});

describe('sendCouponExpiryReminder', () => {
  it('escapes HTML in hotel name and coupon code', async () => {
    const { Resend } = await import('resend');
    const mockSend = vi.fn().mockResolvedValue({ id: 'x' });
    (Resend as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      emails: { send: mockSend },
    }));

    await sendCouponExpiryReminder(
      'user@test.com',
      'Alice',
      '<Hotel & Spa>',
      'HTL-<CODE>',
      '2024-12-31'
    );

    const callArg = mockSend.mock.calls[0]?.[0];
    expect(callArg?.html).not.toContain('<Hotel');
    expect(callArg?.html).toContain('&lt;Hotel &amp; Spa&gt;');
  });
});
