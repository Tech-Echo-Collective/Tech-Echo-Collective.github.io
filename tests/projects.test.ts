import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getProject,
  projectClassifications,
  projectRoles,
  projects,
} from '../lib/projects';
import { memberRoles } from '../lib/types';

describe('project registry', () => {
  it('uses only the three public project classifications', () => {
    expect(projectClassifications).toEqual([
      'tech_echo_project',
      'member_project',
      'collaboration',
    ]);
    expect(
      projects.every((project) => projectClassifications.includes(project.classification)),
    ).toBe(true);
  });

  it('keeps Physics Atlas as Noah #001’s independently maintained member project', () => {
    const physicsAtlas = getProject('physics-atlas');
    expect(physicsAtlas).toMatchObject({
      classification: 'member_project',
      websiteUrl: 'https://atlas.techecho.org/',
      featuredContributors: [
        {
          githubUserId: '267296498',
          githubUsername: 'noahwalkerror-hash',
          role: 'creator_maintainer',
        },
      ],
    });
    expect(physicsAtlas?.repositories.map((repository) => repository.name)).toEqual([
      'Physics-Atlas',
      'Physics-Atlas-Web',
    ]);
  });

  it('publishes Cradles of Civilization as a playable Tech Echo project', () => {
    expect(getProject('cradles-of-civilization')).toMatchObject({
      classification: 'tech_echo_project',
      playable: true,
      websiteUrl: '/games/cradles-of-civilization/',
    });
  });

  it('keeps Illuminatio Physica as Noah #001’s independently maintained member project', () => {
    const illuminatio = getProject('illuminatio-physica');
    expect(illuminatio).toMatchObject({
      classification: 'member_project',
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
    });
    expect(projects.map((project) => project.slug)).toEqual([
      'physics-atlas',
      'cradles-of-civilization',
      'illuminatio-physica',
    ]);
  });

  it('ships Illuminatio Physica assets in the established project logo format', () => {
    const assetDirectory = path.join(process.cwd(), 'public', 'assets', 'projects');

    for (const filename of [
      'illuminatio-physica-mark.svg',
      'illuminatio-physica-logo.svg',
    ]) {
      const asset = fs.readFileSync(path.join(assetDirectory, filename), 'utf8');
      expect(asset).toContain('role="img"');
      expect(asset).toContain('<title id="title">Illuminatio Physica</title>');
      expect(asset).toContain('<desc id="desc">');
    }

    const mark = fs.readFileSync(
      path.join(assetDirectory, 'illuminatio-physica-mark.svg'),
      'utf8',
    );
    expect(mark).toContain('viewBox="0 0 64 64"');
  });

  it('keeps project roles separate from global community roles', () => {
    expect(projectRoles.some((role) => memberRoles.includes(role as never))).toBe(false);
    for (const project of projects) {
      for (const contributor of project.featuredContributors) {
        expect(projectRoles).toContain(contributor.role);
        expect(contributor).not.toHaveProperty('globalRole');
      }
    }
  });
});
