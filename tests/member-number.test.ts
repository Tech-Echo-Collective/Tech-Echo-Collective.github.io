import { describe, expect, it } from 'vitest';
import { formatMemberNumber } from '../lib/member-number';

describe('formatMemberNumber', () => {
  it('uses at least three digits without truncating larger numbers', () => {
    expect(formatMemberNumber(1)).toBe('#001');
    expect(formatMemberNumber(17)).toBe('#017');
    expect(formatMemberNumber(137)).toBe('#137');
    expect(formatMemberNumber(1234)).toBe('#1234');
  });

  it('rejects invalid public numbers', () => {
    expect(() => formatMemberNumber(0)).toThrow();
    expect(() => formatMemberNumber(1.5)).toThrow();
  });
});
