import { ErrorNotice } from './error-notice';
import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/types';

export function ForumError({ locale, code = 'github' }: { locale: Locale; code?: string }) {
  const dictionary = getDictionary(locale);
  return (
    <div className="empty-state">
      <span className="empty-state__signal" aria-hidden="true">
        ×
      </span>
      <h2>{dictionary['common.error']}</h2>
      <ErrorNotice locale={locale} code={code} />
      {code === 'reauthorize' ? (
        <a
          className="button button--primary"
          href={`/auth/start?intent=signin&locale=${locale}`}
        >
          {dictionary['forum.reauthorize']}
        </a>
      ) : (
        <a className="button" href="/forum">
          {dictionary['common.retry']}
        </a>
      )}
    </div>
  );
}
