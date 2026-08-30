# Production deployment checklist

Nothing in this document should be marked complete until the organization owner
has performed and verified it. Do not paste secrets into source control or the
browser.

## 1. Confirm the founder reservation

Confirm that stable GitHub numeric user ID `267296498` is the intended holder of
Tech Echo Member `#001`. The currently observed account is
`noahwalkerror-hash`, but organization ownership/admin rights were not provable
without authenticated access.

If the ID is wrong, change both `FOUNDER_GITHUB_USER_ID` and the founder row in
`drizzle/0000_chilly_black_widow.sql` before the first production migration.
Do not change it after members have joined.

## 2. Create the organization GitHub App

As an owner of `Tech-Echo-Collective`, open:

GitHub organization Settings -> Developer settings -> GitHub Apps -> New GitHub App.

Configure:

- Name: a unique name such as `Tech Echo Community`
- Homepage URL: the final HTTPS `APP_ORIGIN`
- Callback URL: `APP_ORIGIN/auth/callback`
- Expire user authorization tokens: enabled
- Request user authorization during installation: not required
- Webhook: inactive for v0.1
- Repository permissions:
  - Discussions: Read and write
  - Metadata: Read-only (implicit)
- Organization/account permissions: none
- Where can this GitHub App be installed?: Any account

The App must be public so non-organization members can authorize it. Publishing
to GitHub Marketplace is not required.

After creation, install it on the `Tech-Echo-Collective` organization and select
only `Tech-Echo-Discussion`.

Record the Client ID and generate a Client Secret. A private key is not required
by this v0.1 user-to-server flow.

Official references:

- <https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-with-a-github-app-on-behalf-of-a-user>
- <https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app>
- <https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens>

## 3. Configure production variables and secrets

Set these values on the Sites deployment. Secret values must use the host's
secret-variable facility.

| Variable                           | Secret | Production value                       |
| ---------------------------------- | -----: | -------------------------------------- |
| `APP_ORIGIN`                       |     No | Final origin, HTTPS, no trailing slash |
| `GITHUB_CLIENT_ID`                 |     No | GitHub App Client ID                   |
| `GITHUB_CLIENT_SECRET`             |    Yes | GitHub App Client Secret               |
| `SESSION_SECRET`                   |    Yes | At least 32 random bytes, base64url    |
| `TOKEN_ENCRYPTION_KEY`             |    Yes | Exactly 32 random bytes, base64        |
| `GITHUB_DISCUSSIONS_OWNER`         |     No | `Tech-Echo-Collective`                 |
| `GITHUB_DISCUSSIONS_REPO`          |     No | `Tech-Echo-Discussion`                 |
| `GITHUB_DISCUSSIONS_REPOSITORY_ID` |     No | `1293776929`                           |
| `FOUNDER_GITHUB_USER_ID`           |     No | Confirmed stable founder numeric ID    |

Generate the two independent random values locally, never in a shared chat:

```sh
openssl rand -base64 48
openssl rand -base64 32
```

Use the first output for `SESSION_SECRET`. Use the second, including its padding
if present, for `TOKEN_ENCRYPTION_KEY`.

## 4. Database migration

Deploy the migration in `drizzle/0000_chilly_black_widow.sql` to the production
D1 binding named `DB` before enabling public sign-in. The Sites build package
also includes the Drizzle migration metadata.

Verify:

- allocation row `#001` exists with the confirmed reserved GitHub ID;
- the member-number immutability trigger exists;
- the allocation no-delete trigger exists;
- the member-retention and allocation-assignment immutability triggers exist;
- foreign keys and unique indexes exist.

The application also performs idempotent schema initialization as a startup
safety net, but the checked-in migration remains the auditable production source.

## 5. Real GitHub acceptance test

This step is mandatory. It has not been completed without real credentials.

Use a non-founder test GitHub account:

1. Open the production root and choose Join Tech Echo.
2. Confirm GitHub shows only the Tech Echo App and expected repository access.
3. Complete onboarding; note the assigned permanent Member Number.
4. Sign out, sign in again, and confirm the same number returns.
5. Open `/forum`; confirm the six actual categories load.
6. Create a clearly labelled temporary discussion through `/forum/new`.
7. Confirm it appears both in Tech Echo and in the existing GitHub Discussions.
8. Confirm GitHub attributes it to the real test user with the App badge.
9. Add a reply through Tech Echo and confirm it is a real GitHub comment.
10. Add and remove one reaction in Tech Echo; confirm GitHub matches.
11. Remove the temporary test content through GitHub as an administrator.
12. Change the test account's GitHub username or simulate an updated profile and
    confirm the stable Member Number is unchanged.

If GraphQL returns a permission error, inspect the App installation and verify
`Discussions: Read and write` on exactly `Tech-Echo-Discussion`. Do not broaden
to classic `repo` or `public_repo` scopes.

## 6. Domain and GitHub Pages transition

The public website remains on GitHub Pages and moves from
`https://tech-echo-collective.github.io/` to `https://techecho.org/`.
The authenticated account and forum service runs separately at
`https://forum.techecho.org/`. Physics Atlas inherits the organization Pages
domain at `https://techecho.org/Physics-Atlas-Web/`.

For a safe production cutover:

1. Attach `forum.techecho.org` to the Sites deployment and wait for HTTPS.
2. Add `https://forum.techecho.org/auth/callback` to the GitHub App while
   preserving the previous callback during verification.
3. Set `APP_ORIGIN=https://forum.techecho.org` and redeploy.
4. Verify a real OAuth sign-in, authenticated routing, and forum access on the
   new hostname, then remove the previous callback.
5. Point `techecho.org` and `www.techecho.org` to GitHub Pages, set the GitHub
   App homepage to `https://techecho.org/`, and enforce HTTPS after the
   certificate is ready.
6. Keep the original GitHub Pages URL available as GitHub's automatic redirect.
7. Add the new URL-prefix property in Google Search Console and submit
   `/sitemap.xml`.
8. Preserve `public/googlee054abfb1b2b52cf.html` until Search Console ownership
   has been migrated.

The root gateway, privacy, and terms pages are indexable. Authenticated routes
are excluded from the sitemap and disallowed in `robots.txt`.

## 7. Category policy

Do not create language categories. The forum is one shared feed.

The live categories observed during implementation were:

- Announcements
- General
- Ideas
- Polls
- Q&A
- Show and tell

If administrators want Science, Engineering, Game Development, or Projects,
create/rename them in GitHub Discussions deliberately. The Tech Echo UI discovers
the change automatically.

## 8. Launch review

Before public access:

- review privacy and terms copy with the organization;
- confirm backup/observability policies for the D1 identity database;
- test mobile login, onboarding, forum creation, reply, and reaction;
- test all four interface languages;
- confirm secrets are absent from Git history, build output, client bundles, and
  logs;
- confirm HSTS, CSP, frame denial, and MIME protection on the final origin;
- confirm direct GitHub participants display without an invented Member Number;
- document who can rotate GitHub App and encryption credentials.

Token encryption-key rotation is not automated in v0.1. Changing
`TOKEN_ENCRYPTION_KEY` invalidates stored encrypted GitHub credentials and
requires members to authorize again.
