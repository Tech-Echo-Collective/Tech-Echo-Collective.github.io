import aboutEn from '../content/about/en.md?raw';
import aboutEs from '../content/about/es.md?raw';
import aboutFr from '../content/about/fr.md?raw';
import aboutZh from '../content/about/zh.md?raw';
import type { Locale } from './types';

export const ABOUT_SOURCE = {
  repository: 'Tech-Echo-Collective/.github',
  path: 'profile/README.md',
  commitSha: '0df73c22dbcd7a81a3e0ed7834fd2f460b4dbfb1',
  blobSha: '50cb65cbe910274601923e1cadccfb22145a5401',
  sourceUrl: 'https://github.com/Tech-Echo-Collective/.github/blob/main/profile/README.md',
  revisionUrl:
    'https://github.com/Tech-Echo-Collective/.github/blob/0df73c22dbcd7a81a3e0ed7834fd2f460b4dbfb1/profile/README.md',
} as const;

const aboutDocuments: Record<Locale, string> = {
  en: aboutEn,
  zh: aboutZh,
  fr: aboutFr,
  es: aboutEs,
};

export function getAboutDocument(locale: Locale): string {
  return aboutDocuments[locale];
}
