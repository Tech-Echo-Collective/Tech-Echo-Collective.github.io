# Tech Echo Physica naming and reference audit

The canonical family is **Tech Echo Physica**. Each member remains a distinct
project with its existing ownership, visibility, contributors and development
status. This change adds no simulation, scientific-data or account functionality.

| Project             | Previous primary GitHub repository         | Canonical primary repository               |
| ------------------- | ------------------------------------------ | ------------------------------------------ |
| Atlas Physicus      | `Tech-Echo-Collective/Physics-Atlas`       | `Tech-Echo-Collective/atlas-physicus`      |
| Illuminatio Physica | `Tech-Echo-Collective/physica-illuminatio` | `Tech-Echo-Collective/illuminatio-physica` |
| Theatrum Physicum   | `Tech-Echo-Collective/theatrum-physica`    | `Tech-Echo-Collective/theatrum-physicum`   |

Theatrum **Physicum** is intentional Latin grammatical agreement.

## Updated references

- Website project registry, contributor API repository identifiers, four-language
  copy, project detail routes, home cards, About derivatives and SVG asset names.
- Each project README includes the requested family statement. Active project
  links and historical commit/action hyperlinks use canonical GitHub names.
- Atlas and Illuminatio npm package names and lockfile metadata are canonical.
- Atlas Web's source repository constant and `.gitmodules` URL point directly at
  `atlas-physicus`; the wrapper pins the reviewed renamed source.
- Current workspace Git origins and the nested Atlas submodule remote are updated.
- GitHub Actions, deployment files, package/environment configuration and tracked
  hard-coded references were audited across the related repositories.
- Core documentation uses the canonical project names and links. Its versioned
  ontology contracts and the existing Illuminatio Core pin are unchanged.

## Deliberate compatibility names

- `Physics-Atlas-Web` remains the separate auxiliary Pages deployment repository;
  it is not a fourth physics project. No extra repository rename is inferred from
  the three requested primary slugs.
- `physica-core` remains the shared data/contract repository.
- Public origins stay `atlas.techecho.org`, `illuminatio.techecho.org` and
  `techecho.org`. Sites project IDs, Pages CNAME and environment bindings are
  unchanged. GitHub repository IDs are unchanged by renaming.
- The existing `VITE_ATLAS_API_URL` variable still points at
  `https://physics-atlas-api-production.up.railway.app/api`.
- Python imports/CLI names, Railway service/domain names, database/volume names,
  serialized ontology/schema identifiers, release tags and sealed evidence are
  operational or historical identities, not stale repository references. See
  Atlas's deployment guide for its detailed compatibility inventory.
- Local checkout directory names remain stable because existing evidence scripts
  use those paths; their Git remotes use the canonical repository URLs.
- Old website project and icon paths exist only in explicit redirect maps and
  compatibility tests. Every newly emitted project/API/asset link is canonical.
- Prior changelog prose and sealed local evidence retain historical product names.
  The organization profile has no affected project repository links.

## Deployment verification boundary

GitHub Pages uses a workflow deployment and its existing custom hostname.
Railway's signed-in dashboard was inspected read-only after the source push:
both API and worker show the direct canonical `Tech-Echo-Collective/atlas-physicus`
source link and successful active GitHub-triggered deployments of the rename
commit. API deployment: `8fda8c97-982a-4263-8ddc-57365862e389`; worker deployment:
`bc84843e-9342-4503-a2ae-8e11edcb3156`.

The branch selector in both service settings still displays `GitHub Repo not
found`, including after reload, despite those successful deployments. The branch
value therefore could not be independently read in that control. This provider
UI lookup limitation was not treated as evidence of a failed source connection.
No source reconnection, permissions, auto-deploy setting, migration configuration,
database or worker schedule was changed by this task. Existing GitHub-triggered
publication behavior was observed, not enabled by this task.
