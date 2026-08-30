'use client';

import { useEffect, useState } from 'react';

const errorCopy = {
  en: {
    kicker: 'SIGNAL / INTERRUPTED',
    title: 'Something interrupted the signal.',
    detail: 'No account token or forum content was exposed. You can safely try again.',
    retry: 'Try again',
  },
  zh: {
    kicker: '信号 / 中断',
    title: '信号暂时中断。',
    detail: '账户令牌与论坛内容均未暴露，你可以安全地重试。',
    retry: '重试',
  },
  fr: {
    kicker: 'SIGNAL / INTERROMPU',
    title: 'Le signal a été interrompu.',
    detail:
      'Aucun jeton de compte ni contenu du forum n’a été exposé. Vous pouvez réessayer.',
    retry: 'Réessayer',
  },
  es: {
    kicker: 'SEÑAL / INTERRUMPIDA',
    title: 'La señal se interrumpió.',
    detail:
      'No se expuso ningún token de cuenta ni contenido del foro. Puedes volver a intentarlo.',
    retry: 'Intentar de nuevo',
  },
} as const;

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  const [locale, setLocale] = useState<keyof typeof errorCopy>('en');
  useEffect(() => {
    const language = document.documentElement.lang.toLowerCase();
    setLocale(
      language.startsWith('zh')
        ? 'zh'
        : language.startsWith('fr')
          ? 'fr'
          : language.startsWith('es')
            ? 'es'
            : 'en',
    );
  }, []);
  const copy = errorCopy[locale];
  return (
    <main id="main-content" className="legal-shell error-shell">
      <article>
        <img src="/assets/tech-echo-mark.svg" alt="" />
        <span className="section-kicker">{copy.kicker}</span>
        <h1>{copy.title}</h1>
        <p>{copy.detail}</p>
        <button className="button button--primary" type="button" onClick={reset}>
          {copy.retry}
        </button>
      </article>
    </main>
  );
}
