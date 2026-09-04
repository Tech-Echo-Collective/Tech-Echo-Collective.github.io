const gatewayErrors = new Set([
  'configuration',
  'session_required',
  'oauth_denied',
  'oauth_state',
  'unverified_email',
  'reauthorize',
  'rate_limit',
  'validation',
  'github',
  'registration_incomplete',
  'registration_expired',
]);

const gatewayNotices = new Set(['account_not_found', 'membership_created']);

function allowlistedValue(value: unknown, allowed: Set<string>): string | undefined {
  return typeof value === 'string' && allowed.has(value) ? value : undefined;
}

export function safeGatewayError(value: unknown): string | undefined {
  return allowlistedValue(value, gatewayErrors);
}

export function safeGatewayNotice(value: unknown): string | undefined {
  return allowlistedValue(value, gatewayNotices);
}
