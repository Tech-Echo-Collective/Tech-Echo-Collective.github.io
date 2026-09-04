import { describe, expect, it } from 'vitest';
import { resolveOAuthMembershipAction } from '../lib/auth-intent';

describe('OAuth membership intent', () => {
  it('never turns an unknown sign-in into a registration', () => {
    expect(resolveOAuthMembershipAction('signin', null)).toBe('account_not_found');
  });

  it('starts registration only from the explicit join intent', () => {
    expect(resolveOAuthMembershipAction('join', null)).toBe('start_registration');
  });

  it('requires legacy incomplete members to confirm joining', () => {
    const incomplete = { onboardedAt: null };
    expect(resolveOAuthMembershipAction('signin', incomplete)).toBe(
      'registration_incomplete',
    );
    expect(resolveOAuthMembershipAction('join', incomplete)).toBe('start_registration');
  });

  it('signs an existing member in without allocating again', () => {
    const member = { onboardedAt: '2026-08-31T00:00:00.000Z' };
    expect(resolveOAuthMembershipAction('signin', member)).toBe('sign_in');
    expect(resolveOAuthMembershipAction('join', member)).toBe('sign_in');
  });
});
