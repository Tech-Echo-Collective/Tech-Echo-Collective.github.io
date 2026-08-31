import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { findMemberByNumber, requireMember } from '@/lib/auth';
import { getDictionary, htmlLanguage } from '@/lib/i18n';
import { formatMemberNumber } from '@/lib/member-number';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Member',
  robots: { index: false, follow: false },
};

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireMember({ audience: 'account' });
  const { id } = await params;
  const memberNumber = Number(id.replace(/^#/, ''));
  if (!Number.isSafeInteger(memberNumber) || memberNumber < 1) notFound();
  const profile = await findMemberByNumber(memberNumber);
  if (!profile) notFound();
  const dictionary = getDictionary(viewer.preferredLocale);
  const joined = new Intl.DateTimeFormat(htmlLanguage(viewer.preferredLocale), {
    dateStyle: 'long',
  }).format(new Date(profile.joinedAt));
  return (
    <AppShell member={viewer} active="profile" returnTo={`/member/${memberNumber}`}>
      <div className="profile-page">
        <div className="profile-portrait">
          <img src={profile.avatarUrl} alt="" />
          <span>{formatMemberNumber(profile.memberNumber)}</span>
        </div>
        <div className="profile-copy">
          <span className="section-kicker">{dictionary['profile.kicker']}</span>
          <h1>{profile.displayName}</h1>
          <p className="profile-handle">@{profile.githubUsername}</p>
          <dl>
            <div>
              <dt>{dictionary['profile.role']}</dt>
              <dd>{dictionary[`role.${profile.role}`]}</dd>
            </div>
            <div>
              <dt>{dictionary['profile.joined']}</dt>
              <dd>{joined}</dd>
            </div>
            <div>
              <dt>{dictionary['profile.github']}</dt>
              <dd>
                <a
                  href={`https://github.com/${encodeURIComponent(profile.githubUsername)}`}
                >
                  github.com/{profile.githubUsername} ↗
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </AppShell>
  );
}
