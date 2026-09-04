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
  slug: 'physics-atlas' | 'cradles-of-civilization' | 'illuminatio-physica';
  classification: ProjectClassification;
  status: 'active';
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
    slug: 'physics-atlas',
    classification: 'member_project',
    status: 'active',
    mark: '/assets/projects/physics-atlas-mark.svg',
    repositoryUrl: 'https://github.com/Tech-Echo-Collective/Physics-Atlas',
    websiteUrl: 'https://atlas.techecho.org/',
    repositories: [
      { owner: 'Tech-Echo-Collective', name: 'Physics-Atlas', label: 'core' },
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
    classification: 'member_project',
    status: 'active',
    mark: '/assets/projects/illuminatio-physica-mark.svg',
    repositoryUrl: 'https://github.com/Tech-Echo-Collective/physica-illuminatio',
    websiteUrl: 'https://illuminatio-physica.noahwalkerror.chatgpt.site',
    repositories: [
      {
        owner: 'Tech-Echo-Collective',
        name: 'physica-illuminatio',
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
