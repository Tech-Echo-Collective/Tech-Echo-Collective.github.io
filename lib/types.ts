export type Locale = 'en' | 'zh' | 'fr' | 'es';
export const memberRoles = ['founder', 'admin', 'moderator', 'member'] as const;
export type MemberRole = (typeof memberRoles)[number];

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
