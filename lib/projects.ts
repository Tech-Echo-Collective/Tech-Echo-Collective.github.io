export const PHYSICA_FAMILY = {
  id: 'tech-echo-physica',
  name: 'Tech Echo Physica',
} as const;

export const projectClassifications = [
  'tech_echo_project',
  'member_project',
  'collaboration',
] as const;

export type ProjectClassification = (typeof projectClassifications)[number];

export const projectRoles = [
  'creator',
  'creator_maintainer',
  'owner',
  'project_lead',
  'maintainer',
  'core_contributor',
  'contributor',
  'featured_contributor',
] as const;

export type ProjectRole = (typeof projectRoles)[number];

export interface ProjectRepository {
  owner: 'Tech-Echo-Collective';
  name: string;
  label: 'core' | 'web' | 'source';
}

export interface FeaturedProjectContributor {
  githubUserId: string;
  githubUsername: string;
  role: ProjectRole;
}

export interface ProjectDefinition {
  slug:
    | 'atlas-physicus'
    | 'cradles-of-civilization'
    | 'illuminatio-physica'
    | 'theatrum-physicum';
  classification: ProjectClassification;
  family?: typeof PHYSICA_FAMILY.id;
  status: 'active' | 'early_development';
  mark: string;
  repositoryUrl: string;
  websiteUrl?: string;
  playable?: boolean;
  repositories: readonly ProjectRepository[];
  featuredContributors: readonly FeaturedProjectContributor[];
  featured: boolean;
}

export const projects: readonly ProjectDefinition[] = [
  {
    slug: 'atlas-physicus',
    family: PHYSICA_FAMILY.id,
    classification: 'member_project',
    status: 'active',
    mark: '/assets/projects/atlas-physicus-mark.svg',
    repositoryUrl: 'https://github.com/Tech-Echo-Collective/atlas-physicus',
    websiteUrl: 'https://atlas.techecho.org/',
    repositories: [
      { owner: 'Tech-Echo-Collective', name: 'atlas-physicus', label: 'core' },
      { owner: 'Tech-Echo-Collective', name: 'Physics-Atlas-Web', label: 'web' },
    ],
    featuredContributors: [
      {
        githubUserId: '267296498',
        githubUsername: 'noahwalkerror-hash',
        role: 'creator_maintainer',
      },
    ],
    featured: true,
  },
  {
    slug: 'cradles-of-civilization',
    classification: 'tech_echo_project',
    status: 'active',
    mark: '/assets/projects/cradles-of-civilization-mark.svg',
    repositoryUrl: 'https://github.com/Tech-Echo-Collective/cradles-of-civilization',
    websiteUrl: '/games/cradles-of-civilization/',
    playable: true,
    repositories: [
      {
        owner: 'Tech-Echo-Collective',
        name: 'cradles-of-civilization',
        label: 'source',
      },
    ],
    featuredContributors: [
      {
        githubUserId: '267296498',
        githubUsername: 'noahwalkerror-hash',
        role: 'creator',
      },
    ],
    featured: true,
  },
  {
    slug: 'illuminatio-physica',
    family: PHYSICA_FAMILY.id,
    classification: 'member_project',
    status: 'active',
    mark: '/assets/projects/illuminatio-physica-mark.svg',
    repositoryUrl: 'https://github.com/Tech-Echo-Collective/illuminatio-physica',
    websiteUrl: 'https://illuminatio.techecho.org/',
    repositories: [
      {
        owner: 'Tech-Echo-Collective',
        name: 'illuminatio-physica',
        label: 'source',
      },
    ],
    featuredContributors: [
      {
        githubUserId: '267296498',
        githubUsername: 'noahwalkerror-hash',
        role: 'creator_maintainer',
      },
    ],
    featured: true,
  },
  {
    slug: 'theatrum-physicum',
    family: PHYSICA_FAMILY.id,
    classification: 'tech_echo_project',
    status: 'early_development',
    mark: '/assets/projects/theatrum-physicum-mark.svg',
    repositoryUrl: 'https://github.com/Tech-Echo-Collective/theatrum-physicum',
    repositories: [
      {
        owner: 'Tech-Echo-Collective',
        name: 'theatrum-physicum',
        label: 'source',
      },
    ],
    featuredContributors: [
      {
        githubUserId: '267296498',
        githubUsername: 'noahwalkerror-hash',
        role: 'creator_maintainer',
      },
    ],
    featured: true,
  },
] as const;

export type ProjectSlug = ProjectDefinition['slug'];

export function getProject(slug: string): ProjectDefinition | undefined {
  return projects.find((project) => project.slug === slug);
}
