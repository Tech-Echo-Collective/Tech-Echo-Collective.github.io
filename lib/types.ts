export type Locale = 'en' | 'zh' | 'fr' | 'es';
export type MemberRole = 'founder' | 'admin' | 'moderator' | 'member';

export interface Member {
  id: string;
  memberNumber: number;
  githubUserId: string;
  githubNodeId: string;
  githubUsername: string;
  displayName: string;
  avatarUrl: string;
  role: MemberRole;
  preferredLocale: Locale;
  joinedAt: string;
  onboardedAt: string | null;
}

export interface GitHubViewer {
  id: number;
  node_id: string;
  login: string;
  name: string | null;
  avatar_url: string;
}
