import { ErrorNotice } from './error-notice';
import { getOriginConfig } from '@/lib/config';
import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/types';
import { safeForumReturnPath } from '@/lib/validation';

export function ForumError({
  locale,
  code = 'github',
  returnTo = '/',
}: {
  locale: Locale;
  code?: string;
  returnTo?: string;
}) {
  const dictionary = getDictionary(locale);
  const reconnect = new URL('/auth/start', getOriginConfig().accountOrigin);
  reconnect.searchParams.set('intent', 'signin');
  reconnect.searchParams.set('locale', locale);
  reconnect.searchParams.set('next', 'forum');
  reconnect.searchParams.set('returnTo', safeForumReturnPath(returnTo));
  return (
    <div className="empty-state">
      <h2>{dictionary['common.error']}</h2>
      <ErrorNotice locale={locale} code={code} />
      {code === 'reauthorize' ? (
        <a className="button button--primary" href={reconnect.toString()}>
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
