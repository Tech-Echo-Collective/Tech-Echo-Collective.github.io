import type { ReactionGroup } from '@/lib/github';
import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/types';

const reactions = ['THUMBS_UP', 'HEART', 'ROCKET', 'EYES'] as const;

export function ReactionBar({
  subjectId,
  groups,
  csrf,
  returnTo,
  discussionNumber,
  locale,
}: {
  subjectId: string;
  groups: ReactionGroup[];
  csrf: string;
  returnTo: string;
  discussionNumber: number;
  locale: Locale;
}) {
  const dictionary = getDictionary(locale);
  const labels = {
    THUMBS_UP: dictionary['forum.reactionThumbsUp'],
    HEART: dictionary['forum.reactionHeart'],
    ROCKET: dictionary['forum.reactionRocket'],
    EYES: dictionary['forum.reactionEyes'],
  };
  return (
    <div className="reaction-bar" aria-label={dictionary['forum.reactions']}>
      {reactions.map((content) => {
        const group = groups.find((item) => item.content === content);
        return (
          <form action="/api/reactions" method="post" key={content}>
            <input type="hidden" name="csrf" value={csrf} />
            <input type="hidden" name="discussionNumber" value={discussionNumber} />
            <input type="hidden" name="subjectId" value={subjectId} />
            <input type="hidden" name="content" value={content} />
            <input
              type="hidden"
              name="remove"
              value={group?.viewerHasReacted ? '1' : '0'}
            />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              aria-pressed={group?.viewerHasReacted || false}
              aria-label={`${labels[content as keyof typeof labels]}: ${group?.reactors.totalCount || 0}`}
            >
              <span>{labels[content]}</span>
              {group?.reactors.totalCount || 0}
            </button>
          </form>
        );
      })}
    </div>
  );
}
