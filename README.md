# Tech Echo Collective

The production website for Tech Echo Collective: a GitHub-authenticated member
gateway, a multilingual dashboard with project attribution and member identity,
and one forum backed by the existing `Tech-Echo-Collective/Tech-Echo-Discussion`
GitHub Discussions repository.

## Product flow

```text
techecho.org gateway
  -> GitHub App user authorization
  -> explicit membership confirmation
  -> permanent Tech Echo Member #
  -> authenticated techecho.org/home
  -> projects, members, and README-backed organization context
  -> one multilingual forum.techecho.org forum
  -> GitHub Discussions as the only post/comment source of truth
```

There are no Tech Echo passwords and no custom forum-content database. The D1
database stores only member identity, encrypted GitHub credentials, sessions,
short-lived OAuth and pending-registration state, one-time cross-domain sign-in
handoffs, and rate-limit counters, plus a bounded cache of public GitHub
contributor metadata. Account and
forum sessions use separate host-only cookies and are tied to the same device
session family for logout.

## Local development

Requirements: Node.js 22.13 or newer.

1. Copy `.env.example` to `.env.local` and fill the server-side values.
2. Install dependencies with `npm install`.
3. Start the local application with `npm run dev`.
4. Open `http://localhost:3000`.

Useful checks:

```sh
npm run lint
npx tsc --noEmit
npm test
npm run build
npm audit --omit=dev
```

Without GitHub App credentials, the public gateway and legal pages still render,
but GitHub sign-in intentionally stops with a configuration message.

## Documentation

- [Engineering report](docs/ENGINEERING_REPORT.md)
- [Production deployment checklist](docs/DEPLOYMENT.md)
- [Production operations and recovery](docs/OPERATIONS.md)
- [Environment template](.env.example)
- [Initial D1 migration](drizzle/0000_chilly_black_widow.sql)
- [Two-domain session migration](drizzle/0001_tricky_captain_cross.sql)
- [Public contributor-cache migration](drizzle/0002_cute_kingpin.sql)
- [Pending membership and identity-invariant migration](drizzle/0003_mushy_mantis.sql)
- [Release changelog](CHANGELOG.md)

## Canonical community backend

- Organization: <https://github.com/Tech-Echo-Collective>
- Forum repository: <https://github.com/Tech-Echo-Collective/Tech-Echo-Discussion>
- Community Discussions: <https://github.com/orgs/Tech-Echo-Collective/discussions>

The forum repository is public. Content remains publicly readable on GitHub, and
people can also participate directly through GitHub. A GitHub author who has not
joined Tech Echo is shown as a GitHub participant without a Tech Echo Member #.
