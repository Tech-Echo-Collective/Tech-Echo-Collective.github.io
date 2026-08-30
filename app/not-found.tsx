import { getCookieLocale, getDictionary } from '@/lib/i18n';

export default async function NotFound() {
  const dictionary = getDictionary(await getCookieLocale());
  return (
    <main id="main-content" className="legal-shell error-shell">
      <article>
        <img src="/assets/tech-echo-mark.svg" alt="" />
        <span className="section-kicker">{dictionary['common.notFoundKicker']}</span>
        <h1>{dictionary['common.notFoundTitle']}</h1>
        <p>{dictionary['common.notFoundText']}</p>
        <a className="button button--primary" href="/home">
          {dictionary['common.returnHome']}
        </a>
      </article>
    </main>
  );
}
