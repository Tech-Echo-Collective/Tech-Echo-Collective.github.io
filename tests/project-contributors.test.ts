import { describe, expect, it } from 'vitest';
import {
  isAutomationContributor,
  mergeRepositoryContributors,
  type RepositoryContributorResult,
} from '../lib/project-contributors';
import type { Member } from '../lib/types';

const member: Member = {
  id: 'member-1',
  memberNumber: 1,
  githubUserId: '267296498',
  githubNodeId: 'U_kgDOD-6e8g',
  githubUsername: 'an-older-username',
  displayName: 'Noah',
  avatarUrl: 'https://avatars.githubusercontent.com/u/267296498',
  role: 'founder',
  preferredLocale: 'en',
  joinedAt: '2026-08-30T00:00:00.000Z',
  onboardedAt: '2026-08-30T00:00:00.000Z',
};

const sourceResults: RepositoryContributorResult[] = [
  {
    repository: { owner: 'Tech-Echo-Collective', name: 'Physics-Atlas', label: 'core' },
    stale: false,
    truncated: false,
    contributors: [
      {
        id: 267296498,
        login: 'noahwalkerror-hash',
        html_url: 'https://github.com/noahwalkerror-hash',
        type: 'User',
        contributions: 22,
      },
      {
        id: 99,
        login: 'external-person',
        html_url: 'https://github.com/external-person',
        type: 'User',
        contributions: 1,
      },
    ],
  },
  {
    repository: {
      owner: 'Tech-Echo-Collective',
      name: 'Physics-Atlas-Web',
      label: 'web',
    },
    stale: false,
    truncated: false,
    contributors: [
      {
        id: 267296498,
        login: 'noahwalkerror-hash',
        html_url: 'https://github.com/noahwalkerror-hash',
        type: 'User',
        contributions: 6,
      },
    ],
  },
];

describe('project contributor attribution', () => {
  it('merges repositories by stable numeric GitHub ID and matches Member #001', () => {
    const contributors = mergeRepositoryContributors(
      sourceResults,
      new Map([['267296498', member]]),
    );
    const founder = contributors.find(
      (contributor) => contributor.githubUserId === '267296498',
    );

    expect(founder).toMatchObject({
      githubUsername: 'noahwalkerror-hash',
      contributions: 28,
      member: { memberNumber: 1, githubUsername: 'an-older-username' },
    });
    expect(founder?.repositories).toHaveLength(2);
    expect(founder).not.toHaveProperty('avatarUrl');
  });

  it('keeps unmatched identities as external contributors', () => {
    const contributors = mergeRepositoryContributors(sourceResults);
    expect(
      contributors.find((contributor) => contributor.githubUserId === '99'),
    ).toMatchObject({
      githubUsername: 'external-person',
      member: undefined,
    });
  });

  it('marks automation without promoting it into a featured role', () => {
    expect(
      isAutomationContributor({
        id: 7,
        login: 'release-helper[bot]',
        html_url: 'https://github.com/apps/release-helper',
        type: 'Bot',
        contributions: 10,
      }),
    ).toBe(true);
  });
});
