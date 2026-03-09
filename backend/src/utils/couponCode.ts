import crypto from 'crypto';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars: 0,O,1,I
const CODE_LENGTH = 8;
const PREFIX = 'HTL-';

export function generateCouponCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARS[bytes[i]! % CHARS.length];
  }
  return `${PREFIX}${code}`;
}
