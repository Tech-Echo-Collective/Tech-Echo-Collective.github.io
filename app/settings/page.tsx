import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { ErrorNotice } from '@/components/error-notice';
import { getCsrfToken, requireMember } from '@/lib/auth';
import { getDictionary } from '@/lib/i18n';
import { formatMemberNumber } from '@/lib/member-number';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const member = await requireMember({ audience: 'account' });
  const dictionary = getDictionary(member.preferredLocale);
  const csrf = await getCsrfToken('account');
  const params = await searchParams;
  return (
    <AppShell member={member} active="settings" returnTo="/settings">
      <div className="narrow-page">
        <span className="section-kicker">
          ACCOUNT / {formatMemberNumber(member.memberNumber)}
        </span>
        <h1>{dictionary['settings.title']}</h1>
        {params.saved ? (
          <div className="notice notice--success" role="status">
            <span>✓</span>
            <p>{dictionary['settings.saved']}</p>
          </div>
        ) : null}
        <ErrorNotice code={params.error} locale={member.preferredLocale} />
        <form className="stacked-form settings-form" action="/api/settings" method="post">
          <input type="hidden" name="csrf" value={csrf} />
          <label htmlFor="display-name">{dictionary['settings.displayName']}</label>
          <input
            id="display-name"
            name="displayName"
            defaultValue={member.displayName}
            minLength={1}
            maxLength={80}
            required
          />
          <label htmlFor="settings-locale">{dictionary['settings.language']}</label>
          <select id="settings-locale" name="locale" defaultValue={member.preferredLocale}>
            <option value="en">English</option>
            <option value="zh">中文</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
          </select>
          <p className="form-hint">{dictionary['settings.identityNote']}</p>
          <button className="button button--primary" type="submit">
            {dictionary['settings.save']}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
