import { getDictionary } from '@/lib/i18n';
import { formatMemberNumber } from '@/lib/member-number';
import type { GitHubAuthor } from '@/lib/github';
import type { Locale, Member } from '@/lib/types';

export function MemberByline({
  author,
  member,
  locale,
  timestamp,
}: {
  author: GitHubAuthor | null;
  member?: Member;
  locale: Locale;
  timestamp?: React.ReactNode;
}) {
  const dictionary = getDictionary(locale);
  const avatar = member?.avatarUrl || author?.avatarUrl;
  const name =
    member?.displayName || author?.login || dictionary['forum.githubParticipant'];
  return (
    <div className="member-byline">
      {avatar ? (
        <img src={avatar} alt="" />
      ) : (
        <span className="avatar-fallback" aria-hidden="true">
          GH
        </span>
      )}
      <span className="member-byline__text">
        <strong>
          {member ? <a href={`/member/${member.memberNumber}`}>{name}</a> : name}
        </strong>
        <small>
          {member ? (
            <>
              {dictionary['forum.member']} {formatMemberNumber(member.memberNumber)}
            </>
          ) : (
            dictionary['forum.githubParticipant']
          )}
          {timestamp ? <> · {timestamp}</> : null}
        </small>
      </span>
    </div>
  );
}
