import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ReactionBar } from '../components/reaction-bar';

describe('reaction bar', () => {
  it('uses localized text labels instead of character icons', () => {
    const markup = renderToStaticMarkup(
      <ReactionBar
        subjectId="discussion-id"
        groups={[
          {
            content: 'HEART',
            viewerHasReacted: true,
            reactors: { totalCount: 3 },
          },
        ]}
        csrf="csrf-token"
        returnTo="/forum/12"
        discussionNumber={12}
        locale="en"
      />,
    );

    expect(markup).toContain('<span>Thumbs up</span>0');
    expect(markup).toContain('<span>Heart</span>3');
    expect(markup).toContain('<span>Rocket</span>0');
    expect(markup).toContain('<span>Eyes</span>0');
    expect(markup).toContain('aria-label="Heart: 3"');
    expect(markup).toContain('aria-pressed="true"');
  });
});
