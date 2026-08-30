import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/types';

const localeOptions: Array<{ value: Locale; key: keyof ReturnType<typeof getDictionary> }> =
  [
    { value: 'en', key: 'language.english' },
    { value: 'zh', key: 'language.chinese' },
    { value: 'fr', key: 'language.french' },
    { value: 'es', key: 'language.spanish' },
  ];

export function LocaleSwitcher({
  locale,
  returnTo,
  compact = false,
}: {
  locale: Locale;
  returnTo: string;
  compact?: boolean;
}) {
  const dictionary = getDictionary(locale);
  return (
    <form
      className={compact ? 'locale-switcher locale-switcher--compact' : 'locale-switcher'}
      method="post"
      action="/api/locale"
      aria-label={dictionary['settings.language']}
    >
      <input type="hidden" name="returnTo" value={returnTo} />
      {localeOptions.map((option) => (
        <button
          key={option.value}
          type="submit"
          name="locale"
          value={option.value}
          aria-current={locale === option.value ? 'true' : undefined}
        >
          {compact ? option.value.toUpperCase() : dictionary[option.key]}
        </button>
      ))}
    </form>
  );
}
