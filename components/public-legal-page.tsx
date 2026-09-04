import { LocaleSwitcher } from './locale-switcher';
import { getCookieLocale, getDictionary } from '@/lib/i18n';

export async function PublicLegalPage({ type }: { type: 'privacy' | 'terms' }) {
  const locale = await getCookieLocale();
  const dictionary = getDictionary(locale);
  const title = dictionary[type === 'privacy' ? 'legal.privacyTitle' : 'legal.termsTitle'];
  const body = dictionary[type === 'privacy' ? 'legal.privacyBody' : 'legal.termsBody'];
  return (
    <main id="main-content" className="legal-shell">
      <header>
        <a href="/">
          <img src="/assets/tech-echo-logo.svg" alt="Tech Echo Collective" />
        </a>
        <LocaleSwitcher locale={locale} returnTo={`/${type}`} compact />
      </header>
      <article>
        <span className="section-kicker">{dictionary['legal.kicker']}</span>
        <h1>{title}</h1>
        <p>{body}</p>
        <p className="legal-updated">{dictionary['legal.updated']}</p>
        <a className="button" href="/">
          Tech Echo
        </a>
      </article>
    </main>
  );
}
