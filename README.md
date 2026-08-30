# Tech Echo Collective

The production website for Tech Echo Collective: a GitHub-authenticated member
gateway, the multilingual member site, and one forum backed by the existing
`Tech-Echo-Collective/Tech-Echo-Discussion` GitHub Discussions repository.

## Product flow

```text
Tech Echo gateway
  -> GitHub App user authorization
  -> permanent Tech Echo Member #
  -> authenticated /home
  -> one multilingual /forum
  -> GitHub Discussions as the only post/comment source of truth
```

There are no Tech Echo passwords and no custom forum-content database. The D1
database stores only member identity, encrypted GitHub credentials, sessions,
short-lived OAuth state, and rate-limit counters.

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
- [Environment template](.env.example)
- [Initial D1 migration](drizzle/0000_chilly_black_widow.sql)

## Canonical community backend

- Organization: <https://github.com/Tech-Echo-Collective>
- Forum repository: <https://github.com/Tech-Echo-Collective/Tech-Echo-Discussion>
- Community Discussions: <https://github.com/orgs/Tech-Echo-Collective/discussions>

The forum repository is public. Content remains publicly readable on GitHub, and
people can also participate directly through GitHub. A GitHub author who has not
joined Tech Echo is shown as a GitHub participant without a Tech Echo Member #.
