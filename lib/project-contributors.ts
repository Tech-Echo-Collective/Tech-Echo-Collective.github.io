import type { Member } from './types';
import type { ProjectRepository } from './projects';

export interface PublicGitHubContributor {
  id: number;
  login: string;
  html_url: string;
  type: string;
  contributions: number;
}

export interface RepositoryContributorResult {
  repository: ProjectRepository;
  contributors: PublicGitHubContributor[];
  stale: boolean;
  truncated: boolean;
}

export interface ProjectContributor {
  githubUserId: string;
  githubUsername: string;
  profileUrl: string;
  accountType: string;
  contributions: number;
  repositories: string[];
  member?: Member;
  automation: boolean;
}

function repositoryKey(repository: ProjectRepository): string {
  return `${repository.owner}/${repository.name}`;
}

export function isAutomationContributor(contributor: PublicGitHubContributor): boolean {
  return (
    contributor.type.toLowerCase() === 'bot' ||
    /\[bot\]$/i.test(contributor.login) ||
    /(?:^|[-_])bot$/i.test(contributor.login)
  );
}

export function mergeRepositoryContributors(
  results: RepositoryContributorResult[],
  memberMap: Map<string, Member> = new Map(),
): ProjectContributor[] {
  const merged = new Map<string, ProjectContributor>();
  for (const result of results) {
    const key = repositoryKey(result.repository);
    for (const contributor of result.contributors) {
      const githubUserId = String(contributor.id);
      const current = merged.get(githubUserId);
      if (current) {
        current.contributions += contributor.contributions;
        if (!current.repositories.includes(key)) current.repositories.push(key);
        continue;
      }
      merged.set(githubUserId, {
        githubUserId,
        githubUsername: contributor.login,
        profileUrl: contributor.html_url,
        accountType: contributor.type,
        contributions: contributor.contributions,
        repositories: [key],
        member: memberMap.get(githubUserId),
        automation: isAutomationContributor(contributor),
      });
    }
  }
  return [...merged.values()].toSorted((left, right) =>
    left.githubUsername.localeCompare(right.githubUsername, 'en'),
  );
}
