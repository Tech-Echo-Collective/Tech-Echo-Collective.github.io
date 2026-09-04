import { describe, expect, it } from 'vitest';
import { safeGatewayError, safeGatewayNotice } from '../lib/gateway-state';

describe('gateway message continuation', () => {
  it('preserves only known localized errors and notices', () => {
    expect(safeGatewayError('registration_incomplete')).toBe('registration_incomplete');
    expect(safeGatewayError('oauth_denied')).toBe('oauth_denied');
    expect(safeGatewayNotice('account_not_found')).toBe('account_not_found');
    expect(safeGatewayNotice('membership_created')).toBe('membership_created');
    expect(safeGatewayError('arbitrary-query-value')).toBeUndefined();
    expect(safeGatewayNotice('arbitrary-query-value')).toBeUndefined();
  });
});
