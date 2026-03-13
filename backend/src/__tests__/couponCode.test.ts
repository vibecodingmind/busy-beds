import { describe, it, expect } from 'vitest';
import { generateCouponCode } from '../utils/couponCode';

describe('generateCouponCode', () => {
  it('returns a string with the expected prefix', () => {
    const code = generateCouponCode();
    expect(code).toMatch(/^HTL-/);
  });

  it('returns a code of the expected total length (HTL- + 8 chars = 12)', () => {
    const code = generateCouponCode();
    expect(code.length).toBe(12);
  });

  it('only uses allowed characters after the prefix', () => {
    const ALLOWED = /^HTL-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/;
    for (let i = 0; i < 50; i++) {
      expect(generateCouponCode()).toMatch(ALLOWED);
    }
  });

  it('generates unique codes on repeated calls', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateCouponCode()));
    // Expect high uniqueness (collisions are astronomically unlikely at 8 chars)
    expect(codes.size).toBeGreaterThan(95);
  });
});
