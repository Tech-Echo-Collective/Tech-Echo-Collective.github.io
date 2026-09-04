import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { listMembers, requireMember } from '@/lib/auth';
import { getDictionary, htmlLanguage } from '@/lib/i18n';
import { formatMemberNumber } from '@/lib/member-number';
import { getV02Copy } from '@/lib/v02-copy';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Members',
  robots: { index: false, follow: false },
};

export default async function MembersPage() {
  const viewer = await requireMember({ audience: 'account' });
  const members = await listMembers();
  const dictionary = getDictionary(viewer.preferredLocale);
  const copy = getV02Copy(viewer.preferredLocale);
  const dateFormatter = new Intl.DateTimeFormat(htmlLanguage(viewer.preferredLocale), {
    dateStyle: 'medium',
  });

  return (
    <AppShell member={viewer} active="members" returnTo="/members">
      <div className="directory-page members-page">
        <header className="directory-hero">
          <div>
            <span className="section-kicker">{copy.membersPage.eyebrow}</span>
            <h1>{copy.membersPage.title}</h1>
            <p>{copy.membersPage.intro}</p>
          </div>
          <span className="directory-count">
            {String(members.length).padStart(2, '0')} / {copy.membersPage.memberCount}
          </span>
        </header>

        <div className="member-directory">
          {members.map((member) => (
            <article className="member-directory-card" key={member.id}>
              <a
                className="member-directory-card__identity"
                href={`/member/${member.memberNumber}`}
              >
                <img src={member.avatarUrl} alt="" />
                <span>
                  <strong>{member.displayName}</strong>
                  <small>
                    {formatMemberNumber(member.memberNumber)} · @{member.githubUsername}
                  </small>
                </span>
              </a>
              <dl>
                <div>
                  <dt>{copy.membersPage.globalRole}</dt>
                  <dd>{dictionary[`role.${member.role}`]}</dd>
                </div>
                <div>
                  <dt>{copy.membersPage.joined}</dt>
                  <dd>{dateFormatter.format(new Date(member.joinedAt))}</dd>
                </div>
                <div>
                  <dt>{copy.membersPage.githubIdentity}</dt>
                  <dd>
                    <a href={`https://github.com/${member.githubUsername}`}>
                      @{member.githubUsername}
                    </a>
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
