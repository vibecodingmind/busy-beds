import { describe, it, expect } from 'vitest';

/**
 * Sanity check that rate limiter configs export without error.
 * Real rate-limit behaviour is tested at integration level.
 */
describe('rateLimiter exports', () => {
  it('exports expected limiters without throwing', async () => {
    const mod = await import('../middleware/rateLimiter');
    expect(typeof mod.generalLimiter).toBe('function');
    expect(typeof mod.authLimiter).toBe('function');
    expect(typeof mod.passwordResetLimiter).toBe('function');
    expect(typeof mod.couponGenerationLimiter).toBe('function');
    expect(typeof mod.contactFormLimiter).toBe('function');
  });
});
