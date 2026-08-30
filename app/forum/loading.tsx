import { getCookieLocale, getDictionary } from '@/lib/i18n';

export default async function ForumLoading() {
  const dictionary = getDictionary(await getCookieLocale());
  return (
    <div className="forum-loading" aria-busy="true" aria-live="polite">
      <span>{dictionary['common.syncingForum']}</span>
      {[1, 2, 3].map((item) => (
        <i key={item} />
      ))}
    </div>
  );
}
