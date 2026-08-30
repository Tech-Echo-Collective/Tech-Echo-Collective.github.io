import { getCookieLocale, getDictionary } from '@/lib/i18n';

export default async function Loading() {
  const dictionary = getDictionary(await getCookieLocale());
  return (
    <main id="main-content" className="loading-shell" aria-busy="true" aria-live="polite">
      <img src="/assets/tech-echo-mark.svg" alt="" />
      <span>{dictionary['common.loadingSignal']}</span>
      <div>
        <i />
        <i />
        <i />
      </div>
    </main>
  );
}
