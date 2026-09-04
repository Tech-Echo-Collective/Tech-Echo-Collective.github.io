import type { Locale } from './types';
import type { ProjectClassification, ProjectRole, ProjectSlug } from './projects';

interface ProjectCopy {
  name: string;
  summary: string;
  description: string;
  ownership: string;
}

interface V02Copy {
  nav: {
    home: string;
    projects: string;
    forum: string;
    members: string;
    about: string;
    github: string;
  };
  home: {
    intro: string;
    enterForum: string;
    exploreProjects: string;
    featuredProjects: string;
    viewAllProjects: string;
    latestActivity: string;
    latestDiscussions: string;
    noActivity: string;
    activityUnavailable: string;
    quickLinks: string;
  };
  common: {
    active: string;
    viewProject: string;
    viewRepository: string;
    visitWebsite: string;
    playOnline: string;
    source: string;
    profile: string;
    settings: string;
    privacy: string;
    terms: string;
  };
  projectsPage: {
    eyebrow: string;
    title: string;
    intro: string;
    projectCount: string;
    principleTitle: string;
    principleText: string;
  };
  projectDetail: {
    back: string;
    ownership: string;
    featured: string;
    allContributors: string;
    repositories: string;
    sourceHistory: string;
    noFeatured: string;
    externalContributor: string;
    memberContributor: string;
    automation: string;
    historyUnavailable: string;
    historyPartial: string;
    historyStale: string;
    globalBoundary: string;
    repositoryLabels: Record<'core' | 'web' | 'source', string>;
  };
  membersPage: {
    eyebrow: string;
    title: string;
    intro: string;
    memberCount: string;
    githubIdentity: string;
    joined: string;
    globalRole: string;
  };
  aboutPage: {
    eyebrow: string;
    title: string;
    intro: string;
    canonicalSource: string;
    maintainedDerivative: string;
    revision: string;
  };
  classifications: Record<ProjectClassification, string>;
  projectRoles: Record<ProjectRole, string>;
  projects: Record<ProjectSlug, ProjectCopy>;
}

const en: V02Copy = {
  nav: {
    home: 'Home',
    projects: 'Projects',
    forum: 'Forum',
    members: 'Members',
    about: 'About',
    github: 'GitHub',
  },
  home: {
    intro:
      'Science, engineering, open-source projects, games, and long-form technical discussion.',
    enterForum: 'Enter Forum',
    exploreProjects: 'Explore Projects',
    featuredProjects: 'Featured projects',
    viewAllProjects: 'View all projects',
    latestActivity: 'Latest activity',
    latestDiscussions: 'From the shared Tech Echo forum',
    noActivity: 'No discussions have been published yet.',
    activityUnavailable: 'Live forum activity is temporarily unavailable.',
    quickLinks: 'Quick links',
  },
  common: {
    active: 'Active',
    viewProject: 'View project',
    viewRepository: 'View repository',
    visitWebsite: 'Visit website',
    playOnline: 'Play online',
    source: 'Source',
    profile: 'My profile',
    settings: 'Settings',
    privacy: 'Privacy',
    terms: 'Terms',
  },
  projectsPage: {
    eyebrow: 'PROJECTS / ATTRIBUTION / OPEN HISTORY',
    title: 'Projects',
    intro:
      'Real work, with ownership and contribution history kept explicit. Project placement never implies a transfer of authorship or authority.',
    projectCount: 'active projects',
    principleTitle: 'Ownership before visibility',
    principleText:
      'Tech Echo distinguishes collective projects, independently owned member projects, and collaborations. Every detail page states which model applies.',
  },
  projectDetail: {
    back: 'Back to projects',
    ownership: 'Ownership',
    featured: 'Featured contributors',
    allContributors: 'GitHub-linked contributor history',
    repositories: 'Repositories and links',
    sourceHistory:
      'GitHub’s Contributors API is the factual source for linked account history; anonymous commits are not included.',
    noFeatured: 'No featured project roles have been explicitly assigned.',
    externalContributor: 'External contributor',
    memberContributor: 'Tech Echo member',
    automation: 'Automation account',
    historyUnavailable: 'GitHub contributor history is temporarily unavailable.',
    historyPartial: 'Some repository contributor history could not be refreshed.',
    historyStale: 'Showing the most recent cached GitHub contributor history.',
    globalBoundary:
      'Project roles describe attribution only. They do not grant site, forum, repository, or organization permissions.',
    repositoryLabels: {
      core: 'Core repository',
      web: 'Web deployment',
      source: 'Source repository',
    },
  },
  membersPage: {
    eyebrow: 'MEMBERS / PERMANENT IDENTITY',
    title: 'Members',
    intro:
      'The Tech Echo member directory is built from verified GitHub identities and permanent member numbers.',
    memberCount: 'registered members',
    githubIdentity: 'GitHub identity',
    joined: 'Joined',
    globalRole: 'Community role',
  },
  aboutPage: {
    eyebrow: 'ABOUT / README-BACKED',
    title: 'About Tech Echo',
    intro:
      'Identity and philosophy derive from the canonical organization README. Current project and permission notes are maintained as website policy.',
    canonicalSource: 'Canonical Tech Echo README',
    maintainedDerivative: 'README-derived identity · current website policy',
    revision: 'Source revision',
  },
  classifications: {
    tech_echo_project: 'Tech Echo Project',
    member_project: 'Member Project',
    collaboration: 'Collaboration',
  },
  projectRoles: {
    creator: 'Creator',
    creator_maintainer: 'Creator & Maintainer',
    owner: 'Owner',
    project_lead: 'Project Lead',
    maintainer: 'Maintainer',
    core_contributor: 'Core Contributor',
    contributor: 'Contributor',
    featured_contributor: 'Featured Contributor',
  },
  projects: {
    'physics-atlas': {
      name: 'Physics Atlas',
      summary: 'A living map of physics research ecosystems.',
      description:
        'An open, interactive atlas for exploring the structure and evolution of physics research through scientific knowledge graphs.',
      ownership: 'Created and maintained independently by Noah #001.',
    },
    'cradles-of-civilization': {
      name: 'Cradles of Civilization',
      summary: 'An original text strategy game in active development.',
      description:
        'A public game project and testbed for worldbuilding, systems design, tooling, and transparent development.',
      ownership: 'A Tech Echo Collective project.',
    },
    'illuminatio-physica': {
      name: 'Illuminatio Physica',
      summary: 'An interactive map of physics concepts and learning paths.',
      description:
        'An interactive 3D knowledge graph for exploring physics concepts, semantic relations, prerequisites, and learning paths.',
      ownership: 'Created and maintained independently by Noah #001.',
    },
  },
};

const zh: V02Copy = {
  nav: {
    home: '首页',
    projects: '项目',
    forum: '论坛',
    members: '成员',
    about: '关于',
    github: 'GitHub',
  },
  home: {
    intro: '科学、工程、开源项目、游戏，以及长期技术讨论。',
    enterForum: '进入论坛',
    exploreProjects: '探索项目',
    featuredProjects: '精选项目',
    viewAllProjects: '查看全部项目',
    latestActivity: '最新动态',
    latestDiscussions: '来自 Tech Echo 共享论坛',
    noActivity: '目前还没有已发布的讨论。',
    activityUnavailable: '论坛实时动态暂时无法读取。',
    quickLinks: '快捷入口',
  },
  common: {
    active: '进行中',
    viewProject: '查看项目',
    viewRepository: '查看仓库',
    visitWebsite: '访问网站',
    playOnline: '在线游玩',
    source: '来源',
    profile: '我的资料',
    settings: '设置',
    privacy: '隐私',
    terms: '条款',
  },
  projectsPage: {
    eyebrow: '项目 / 归属 / 公开记录',
    title: '项目',
    intro:
      '展示真实工作，同时明确归属与贡献记录。项目被收录，并不意味着作者身份或管理权发生转移。',
    projectCount: '个进行中的项目',
    principleTitle: '归属先于展示',
    principleText:
      'Tech Echo 区分共同体项目、独立的成员项目与协作项目；每个详情页都会明确适用哪一种模式。',
  },
  projectDetail: {
    back: '返回项目列表',
    ownership: '项目归属',
    featured: '重点贡献者',
    allContributors: 'GitHub 关联贡献记录',
    repositories: '仓库与链接',
    sourceHistory:
      '本列表以 GitHub Contributors API 返回的关联账户记录为事实来源；不包含匿名提交。',
    noFeatured: '目前没有明确指定的重点项目角色。',
    externalContributor: '外部贡献者',
    memberContributor: 'Tech Echo 成员',
    automation: '自动化账户',
    historyUnavailable: 'GitHub 贡献记录暂时无法读取。',
    historyPartial: '部分仓库的贡献记录暂时无法刷新。',
    historyStale: '当前显示最近一次缓存的 GitHub 贡献记录。',
    globalBoundary: '项目角色只用于说明项目归属，不会授予官网、论坛、仓库或组织权限。',
    repositoryLabels: { core: '核心仓库', web: 'Web 部署仓库', source: '源代码仓库' },
  },
  membersPage: {
    eyebrow: '成员 / 永久身份',
    title: '成员',
    intro: 'Tech Echo 成员目录由经过验证的 GitHub 身份与永久会员编号构成。',
    memberCount: '名已注册成员',
    githubIdentity: 'GitHub 身份',
    joined: '加入时间',
    globalRole: '共同体角色',
  },
  aboutPage: {
    eyebrow: '关于 / README 驱动',
    title: '关于 Tech Echo',
    intro: '共同体身份与理念来自权威组织 README；当前项目与权限说明则作为官网政策维护。',
    canonicalSource: 'Tech Echo 权威 README',
    maintainedDerivative: 'README 派生身份 · 当前官网政策',
    revision: '来源版本',
  },
  classifications: {
    tech_echo_project: 'Tech Echo 项目',
    member_project: '成员项目',
    collaboration: '协作项目',
  },
  projectRoles: {
    creator: '创建者',
    creator_maintainer: '创建者与维护者',
    owner: '所有者',
    project_lead: '项目负责人',
    maintainer: '维护者',
    core_contributor: '核心贡献者',
    contributor: '贡献者',
    featured_contributor: '主要贡献者',
  },
  projects: {
    'physics-atlas': {
      name: 'Physics Atlas',
      summary: '一幅持续生长的物理研究生态地图。',
      description: '一个开放的交互式图谱，通过科学知识图谱探索物理研究结构与演化。',
      ownership: '由 Noah #001 独立创建并维护。',
    },
    'cradles-of-civilization': {
      name: '文明摇篮',
      summary: '一款正在持续开发的原创文字策略游戏。',
      description:
        '一个公开的游戏项目，也是世界观、系统设计、开发工具与透明制作流程的试验场。',
      ownership: 'Tech Echo Collective 项目。',
    },
    'illuminatio-physica': {
      name: 'Illuminatio Physica',
      summary: '一幅用于探索物理概念与学习路径的交互式三维知识地图。',
      description:
        '一个交互式三维物理知识图谱，用于探索物理概念、语义关系、先修依赖与学习路径。',
      ownership: '由 Noah #001 独立创建并维护。',
    },
  },
};

const fr: V02Copy = {
  nav: {
    home: 'Accueil',
    projects: 'Projets',
    forum: 'Forum',
    members: 'Membres',
    about: 'À propos',
    github: 'GitHub',
  },
  home: {
    intro:
      'Science, ingénierie, projets open source, jeux et discussions techniques approfondies.',
    enterForum: 'Entrer dans le forum',
    exploreProjects: 'Explorer les projets',
    featuredProjects: 'Projets à la une',
    viewAllProjects: 'Voir tous les projets',
    latestActivity: 'Activité récente',
    latestDiscussions: 'Depuis le forum commun de Tech Echo',
    noActivity: 'Aucune discussion n’a encore été publiée.',
    activityUnavailable: 'L’activité du forum est temporairement indisponible.',
    quickLinks: 'Accès rapides',
  },
  common: {
    active: 'Actif',
    viewProject: 'Voir le projet',
    viewRepository: 'Voir le dépôt',
    visitWebsite: 'Visiter le site',
    playOnline: 'Jouer en ligne',
    source: 'Source',
    profile: 'Mon profil',
    settings: 'Paramètres',
    privacy: 'Confidentialité',
    terms: 'Conditions',
  },
  projectsPage: {
    eyebrow: 'PROJETS / ATTRIBUTION / HISTORIQUE OUVERT',
    title: 'Projets',
    intro:
      'Des réalisations concrètes, avec une propriété et un historique des contributions explicites. La présence d’un projet ne transfère ni la qualité d’auteur ni l’autorité.',
    projectCount: 'projets actifs',
    principleTitle: 'La propriété avant la visibilité',
    principleText:
      'Tech Echo distingue les projets du collectif, les projets indépendants de membres et les collaborations. Chaque fiche précise le modèle applicable.',
  },
  projectDetail: {
    back: 'Retour aux projets',
    ownership: 'Propriété',
    featured: 'Contributeurs mis en avant',
    allContributors: 'Historique des contributeurs liés sur GitHub',
    repositories: 'Dépôts et liens',
    sourceHistory:
      'L’API Contributors de GitHub est la source factuelle des comptes liés ; les commits anonymes ne sont pas inclus.',
    noFeatured: 'Aucun rôle de projet mis en avant n’a été attribué explicitement.',
    externalContributor: 'Contributeur externe',
    memberContributor: 'Membre de Tech Echo',
    automation: 'Compte automatisé',
    historyUnavailable:
      'L’historique des contributions GitHub est temporairement indisponible.',
    historyPartial: 'Une partie de l’historique des dépôts n’a pas pu être actualisée.',
    historyStale: 'Affichage du dernier historique GitHub mis en cache.',
    globalBoundary:
      'Les rôles de projet décrivent uniquement l’attribution. Ils n’accordent aucun droit sur le site, le forum, les dépôts ou l’organisation.',
    repositoryLabels: {
      core: 'Dépôt principal',
      web: 'Déploiement web',
      source: 'Dépôt source',
    },
  },
  membersPage: {
    eyebrow: 'MEMBRES / IDENTITÉ PERMANENTE',
    title: 'Membres',
    intro:
      'L’annuaire Tech Echo repose sur des identités GitHub vérifiées et des numéros de membre permanents.',
    memberCount: 'membres inscrits',
    githubIdentity: 'Identité GitHub',
    joined: 'Arrivée',
    globalRole: 'Rôle communautaire',
  },
  aboutPage: {
    eyebrow: 'À PROPOS / BASÉ SUR LE README',
    title: 'À propos de Tech Echo',
    intro:
      'L’identité et la philosophie dérivent du README canonique de l’organisation. Les règles actuelles de projet et de permission sont maintenues comme politique du site.',
    canonicalSource: 'README canonique de Tech Echo',
    maintainedDerivative: 'Identité issue du README · politique actuelle du site',
    revision: 'Révision source',
  },
  classifications: {
    tech_echo_project: 'Projet Tech Echo',
    member_project: 'Projet de membre',
    collaboration: 'Collaboration',
  },
  projectRoles: {
    creator: 'Créateur',
    creator_maintainer: 'Créateur et mainteneur',
    owner: 'Propriétaire',
    project_lead: 'Responsable du projet',
    maintainer: 'Mainteneur',
    core_contributor: 'Contributeur principal',
    contributor: 'Contributeur',
    featured_contributor: 'Contributeur principal',
  },
  projects: {
    'physics-atlas': {
      name: 'Physics Atlas',
      summary: 'Une cartographie vivante des écosystèmes de recherche en physique.',
      description:
        'Un atlas ouvert et interactif pour explorer la structure et l’évolution de la recherche en physique grâce aux graphes de connaissances scientifiques.',
      ownership: 'Créé et maintenu indépendamment par Noah #001.',
    },
    'cradles-of-civilization': {
      name: 'Cradles of Civilization',
      summary: 'Un jeu de stratégie textuel original en développement actif.',
      description:
        'Un projet de jeu public et un terrain d’essai pour la création d’univers, la conception de systèmes, les outils et le développement transparent.',
      ownership: 'Un projet de Tech Echo Collective.',
    },
    'illuminatio-physica': {
      name: 'Illuminatio Physica',
      summary:
        'Une carte 3D interactive des concepts physiques et des parcours d’apprentissage.',
      description:
        'Un graphe de connaissances 3D interactif pour explorer les concepts physiques, leurs relations sémantiques, leurs prérequis et leurs parcours d’apprentissage.',
      ownership: 'Créé et maintenu indépendamment par Noah #001.',
    },
  },
};

const es: V02Copy = {
  nav: {
    home: 'Inicio',
    projects: 'Proyectos',
    forum: 'Foro',
    members: 'Miembros',
    about: 'Acerca de',
    github: 'GitHub',
  },
  home: {
    intro:
      'Ciencia, ingeniería, proyectos de código abierto, juegos y debate técnico en profundidad.',
    enterForum: 'Entrar al foro',
    exploreProjects: 'Explorar proyectos',
    featuredProjects: 'Proyectos destacados',
    viewAllProjects: 'Ver todos los proyectos',
    latestActivity: 'Actividad reciente',
    latestDiscussions: 'Desde el foro compartido de Tech Echo',
    noActivity: 'Todavía no se ha publicado ninguna discusión.',
    activityUnavailable: 'La actividad del foro no está disponible temporalmente.',
    quickLinks: 'Accesos rápidos',
  },
  common: {
    active: 'Activo',
    viewProject: 'Ver proyecto',
    viewRepository: 'Ver repositorio',
    visitWebsite: 'Visitar sitio',
    playOnline: 'Jugar en línea',
    source: 'Fuente',
    profile: 'Mi perfil',
    settings: 'Ajustes',
    privacy: 'Privacidad',
    terms: 'Condiciones',
  },
  projectsPage: {
    eyebrow: 'PROYECTOS / ATRIBUCIÓN / HISTORIAL ABIERTO',
    title: 'Proyectos',
    intro:
      'Trabajo real, con propiedad e historial de contribuciones explícitos. Incluir un proyecto no transfiere autoría ni autoridad.',
    projectCount: 'proyectos activos',
    principleTitle: 'La propiedad antes que la visibilidad',
    principleText:
      'Tech Echo distingue proyectos del colectivo, proyectos independientes de miembros y colaboraciones. Cada ficha indica qué modelo se aplica.',
  },
  projectDetail: {
    back: 'Volver a proyectos',
    ownership: 'Propiedad',
    featured: 'Colaboradores destacados',
    allContributors: 'Historial de colaboradores vinculados en GitHub',
    repositories: 'Repositorios y enlaces',
    sourceHistory:
      'La API Contributors de GitHub es la fuente factual de las cuentas vinculadas; no incluye commits anónimos.',
    noFeatured: 'No se ha asignado de forma explícita ningún rol destacado del proyecto.',
    externalContributor: 'Colaborador externo',
    memberContributor: 'Miembro de Tech Echo',
    automation: 'Cuenta automatizada',
    historyUnavailable:
      'El historial de contribuciones de GitHub no está disponible temporalmente.',
    historyPartial: 'No se pudo actualizar parte del historial de los repositorios.',
    historyStale: 'Se muestra el historial de GitHub más reciente guardado en caché.',
    globalBoundary:
      'Los roles de proyecto solo describen atribución. No conceden permisos del sitio, foro, repositorio u organización.',
    repositoryLabels: {
      core: 'Repositorio principal',
      web: 'Despliegue web',
      source: 'Repositorio fuente',
    },
  },
  membersPage: {
    eyebrow: 'MIEMBROS / IDENTIDAD PERMANENTE',
    title: 'Miembros',
    intro:
      'El directorio de Tech Echo se basa en identidades de GitHub verificadas y números de miembro permanentes.',
    memberCount: 'miembros registrados',
    githubIdentity: 'Identidad de GitHub',
    joined: 'Se unió',
    globalRole: 'Rol comunitario',
  },
  aboutPage: {
    eyebrow: 'ACERCA DE / BASADO EN README',
    title: 'Acerca de Tech Echo',
    intro:
      'La identidad y la filosofía derivan del README canónico de la organización. Las reglas actuales de proyectos y permisos se mantienen como política del sitio.',
    canonicalSource: 'README canónico de Tech Echo',
    maintainedDerivative: 'Identidad derivada del README · política actual del sitio',
    revision: 'Revisión de origen',
  },
  classifications: {
    tech_echo_project: 'Proyecto de Tech Echo',
    member_project: 'Proyecto de miembro',
    collaboration: 'Colaboración',
  },
  projectRoles: {
    creator: 'Creador',
    creator_maintainer: 'Creador y mantenedor',
    owner: 'Propietario',
    project_lead: 'Responsable del proyecto',
    maintainer: 'Mantenedor',
    core_contributor: 'Colaborador principal',
    contributor: 'Colaborador',
    featured_contributor: 'Colaborador destacado',
  },
  projects: {
    'physics-atlas': {
      name: 'Physics Atlas',
      summary: 'Un mapa vivo de los ecosistemas de investigación en física.',
      description:
        'Un atlas abierto e interactivo para explorar la estructura y evolución de la investigación en física mediante grafos de conocimiento científico.',
      ownership: 'Creado y mantenido de forma independiente por Noah #001.',
    },
    'cradles-of-civilization': {
      name: 'Cradles of Civilization',
      summary: 'Un juego original de estrategia textual en desarrollo activo.',
      description:
        'Un proyecto de juego público y banco de pruebas para narrativa, diseño de sistemas, herramientas y desarrollo transparente.',
      ownership: 'Un proyecto de Tech Echo Collective.',
    },
    'illuminatio-physica': {
      name: 'Illuminatio Physica',
      summary: 'Un mapa 3D interactivo de conceptos físicos y rutas de aprendizaje.',
      description:
        'Un grafo de conocimiento 3D interactivo para explorar conceptos físicos, relaciones semánticas, prerrequisitos y rutas de aprendizaje.',
      ownership: 'Creado y mantenido de forma independiente por Noah #001.',
    },
  },
};

const copies: Record<Locale, V02Copy> = { en, zh, fr, es };

export function getV02Copy(locale: Locale): V02Copy {
  return copies[locale];
}
