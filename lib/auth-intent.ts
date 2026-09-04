export type OAuthIntent = 'signin' | 'join';

export type OAuthMembershipAction =
  | 'sign_in'
  | 'start_registration'
  | 'account_not_found'
  | 'registration_incomplete';

export function resolveOAuthMembershipAction(
  intent: OAuthIntent,
  member: { onboardedAt: string | null } | null,
): OAuthMembershipAction {
  if (member?.onboardedAt) return 'sign_in';
  if (intent === 'join') return 'start_registration';
  return member ? 'registration_incomplete' : 'account_not_found';
}
