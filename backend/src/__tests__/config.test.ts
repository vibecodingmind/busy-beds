import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('config — JWT_SECRET production guard', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset module registry so config re-evaluates
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws when NODE_ENV=production and JWT_SECRET is missing', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    await expect(() => import('../config/index')).rejects.toThrow(
      /JWT_SECRET.*required in production/i
    );
  });
});
