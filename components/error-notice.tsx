import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/types';

const errorKeys = {
  configuration: 'error.configuration',
  session_required: 'error.session_required',
  oauth_denied: 'error.oauth_denied',
  oauth_state: 'error.oauth_state',
  unverified_email: 'error.unverified_email',
  reauthorize: 'error.reauthorize',
  rate_limit: 'error.rate_limit',
  validation: 'error.validation',
  github: 'error.github',
} as const;

export function ErrorNotice({ code, locale }: { code?: string; locale: Locale }) {
  if (!code) return null;
  const dictionary = getDictionary(locale);
  const key = errorKeys[code as keyof typeof errorKeys] || 'common.error';
  return (
    <div className="notice notice--error" role="alert">
      <span aria-hidden="true">!</span>
      <p>{dictionary[key]}</p>
    </div>
  );
}
