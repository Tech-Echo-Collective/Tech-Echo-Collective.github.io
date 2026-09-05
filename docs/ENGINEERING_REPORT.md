# Tech Echo account and forum — engineering report

## v0.2.1 membership confirmation and operations hardening

GitHub verification no longer creates a Tech Echo membership. An unknown Sign In
returns to the Join explanation without allocating a number, saving a long-term
credential, or creating a session. Join stores the verified GitHub identity and
credential in an encrypted, hashed-cookie-bound, 30-minute pending registration.
The permanent member row, credential, Member Number, and session are created only
after the user reviews the disclosure and explicitly confirms membership.

Legacy incomplete member rows remain immutable but are excluded from directories,
profiles, forum Member attribution, and authenticated routes. Rejoining with the
same stable GitHub ID resumes that original Member Number instead of allocating a
new one. Founder GitHub ID `267296498` remains the only identity that can claim
`#001`.

Operational additions include CI, scheduled no-side-effect production smoke
checks, a non-disclosing D1 health endpoint, offline backup verification, and a
backup/restore runbook. v0.2.3 adds a daily, transactionally consistent durable
identity snapshot, AES-256-GCM encrypted GitHub artifact retention, and guarded
restore-SQL generation. Short-lived login, OAuth, registration, and cache state
is intentionally excluded.

## v0.2 dashboard, projects, contributors, and About

The v0.2 release keeps the v0.1 authentication, permanent Member Number,
two-domain session, and GitHub Discussions architecture intact. It adds:

- a restrained single-screen authenticated Home dashboard;
- independent Projects, Project Detail, Members, and About destinations;
- explicit Tech Echo Project, Member Project, and Collaboration classifications;
- a clear Atlas Physicus attribution to Noah `#001` as an independently created
  and maintained Member Project;
- separate global community roles and project-specific recognition roles;
- text-only contributor history loaded from GitHub's public Contributors API;
- stable numeric GitHub ID matching from contributors to Tech Echo members;
- a six-hour D1 freshness window, retry backoff, and 48-hour maximum stale
  retention for public contributor metadata;
- a four-language About presentation derived from the canonical organization
  README at `Tech-Echo-Collective/.github/profile/README.md`.

The About derivatives are pinned to canonical revision
`0df73c22dbcd7a81a3e0ed7834fd2f460b4dbfb1` and expose a link to that source.
The project contributor reader deliberately sends no forum credential and does
not expand the GitHub App beyond `Tech-Echo-Discussion`. Contributor identity,
project recognition, global Tech Echo authority, and repository permissions
remain four separate concerns.

Migration `0002_cute_kingpin.sql` adds only the public contributor cache. It does
not alter members, Member Numbers, credentials, sessions, forum content, or
permissions. Package and release version are `0.2.0`; the production tag is only
created after production verification.

## Outcome

This change converts the former four-page GitHub Pages site into one
server-rendered application with:

- a public GitHub sign-in/join gateway;
- GitHub App user-to-server authentication with real GitHub authorship;
- a persistent Tech Echo profile and permanent sequential Member Number;
- short first-login onboarding and four-language preference;
- an authenticated, redesigned version of the existing Tech Echo website;
- one authenticated forum at `/forum`;
- real GitHub Discussions, comments, and reactions rendered in the Tech Echo UI;
- public privacy and terms pages;
- responsive, accessible loading, empty, error, and validation states.

## Existing architecture discovered

The original production site was plain HTML and CSS deployed from the root of
`main` through GitHub Pages. It had no framework, runtime, API, authentication,
database, JavaScript router, or GitHub write integration. English, Chinese,
French, and Spanish were maintained as four copied HTML pages.

The original design system was preserved: near-black navy, fine blue grid,
electric blue/cyan, self-hosted IBM Plex Sans and Mono, serif Tech Echo
wordmark, thin technical borders, large type, restrained instrumentation, and
the Latin motto:

> Mementote humilitatis, etiam ex pulvere stellarum nati.

GitHub Pages alone cannot safely hold OAuth secrets, exchange authorization
codes, issue server-side sessions, allocate member numbers, or proxy authenticated
GraphQL writes. The implementation therefore uses Vinext/React on a Cloudflare
Worker-compatible Sites runtime with D1.

## Discussion repository discovered and reused

No forum repository was created.

- Owner: `Tech-Echo-Collective`
- Repository: `Tech-Echo-Discussion`
- Numeric repository ID: `1293776929`
- GraphQL node ID: `R_kgDOTR14IQ`
- Discussions: enabled
- Visibility: public

The application fixes all GraphQL operations to that verified owner, repository,
and numeric ID. It dynamically loads the repository's actual categories instead
of inventing node IDs or silently changing GitHub configuration.

At discovery time the real categories were Announcements, General, Ideas, Polls,
Q&A, and Show and tell. Science, Engineering, Game Development, and Projects are
reasonable future administrator changes, but v0.1 does not mutate categories.
The separate `cradles-of-civilization` project Discussions are intentionally not
aggregated.

## Authentication and GitHub authorship

The identity mechanism is an organization-owned public GitHub App:

1. The server generates a one-time state and PKCE S256 verifier.
2. The encrypted verifier is stored in D1 for ten minutes; the browser receives
   only an HttpOnly, SameSite=Lax state cookie.
3. The callback consumes the state exactly once and exchanges the code on the
   server with `repository_id=1293776929`.
4. `GET /user` supplies the stable numeric GitHub ID and GraphQL node ID.
5. The app looks up the Tech Echo member by numeric ID, never username. Sign In
   never creates an unknown member.
6. Join stores the verified identity and GitHub token in an encrypted, expiring
   pending record. No Member Number exists until the person explicitly confirms.
7. Confirmation consumes that record once, creates or completes the member, and
   stores access and refresh tokens AES-GCM encrypted at rest.
8. The browser receives an opaque Tech Echo session; D1 stores only its hash.

Discussion and comment mutations use the authenticated member's GitHub App
user-to-server token. GitHub therefore records the real GitHub user as author;
Tech Echo maps GraphQL user node IDs to permanent member profiles. Tokens never
enter browser JavaScript.

GitHub App user tokens are preferred over a classic OAuth App because the App
can be installed only on the one forum repository with Discussions permission.
No traditional `repo` or `public_repo` OAuth scope is requested.

## Database approach

D1/SQLite is deliberately an identity store, not a forum database.

Tables:

- `member_number_allocations`: append-only permanent number ledger;
- `members`: Tech Echo identity and locale;
- `github_credentials`: encrypted per-user GitHub App tokens;
- `sessions`: hashed opaque session identifiers;
- `oauth_states`: expiring, one-use OAuth transactions;
- `pending_registrations`: encrypted, expiring, one-use Join confirmations;
- `rate_limits`: member/IP write buckets.

GitHub Discussions remains canonical for titles, bodies, categories, comments,
replies, reactions, timestamps, and edit history.

### Permanent Member Number allocation

`member_number_allocations.member_number` is an SQLite
`INTEGER PRIMARY KEY AUTOINCREMENT`. First-login allocation and member creation
are submitted as one D1 batch, and the stable GitHub numeric ID is unique, so
concurrent callbacks cannot create two identities for one user.

The initial migration:

- reserves `#001` for GitHub numeric user ID `267296498`;
- prevents changes to an assigned member number with a trigger;
- prevents deletion of allocation rows with a trigger;
- uses unique constraints for member number, GitHub numeric ID, and GitHub node
  ID.

Numbers are formatted to at least three digits in the UI. They are not primary
member keys, never reassigned, and remain stable after a GitHub username change.
Before public launch, an organization administrator must confirm that
`267296498` is the intended founder account.

## Routes

Public:

- `/` — sign-in/join gateway
- `/auth/start` and `/auth/callback` — GitHub authorization
- `/privacy`, `/terms`
- `/robots.txt`, `/sitemap.xml`
- `/zh`, `/fr`, `/es` — compatibility redirects to the gateway locale

Authenticated:

- `/onboarding`
- `/home`
- `/forum`
- `/forum/[number]`
- `/forum/new`
- `/member/[id]`
- `/settings`

Server mutation endpoints:

- `/api/onboarding`, `/api/settings`, `/api/locale`, `/api/logout`
- `/api/discussions`
- `/api/discussions/[number]/comments`
- `/api/reactions`

## Main implementation areas

- `app/`: routes, API handlers, metadata, security-compatible page states;
- `components/`: shared shell, locale controls, member identity, safe Markdown,
  reactions, error/legal views;
- `lib/auth.ts`, `lib/oauth.ts`, `lib/crypto.ts`: identity and token boundary;
- `lib/github.ts`: fixed-repository GitHub GraphQL adapter;
- `lib/validation.ts`, `lib/rate-limit.ts`: write validation and abuse limits;
- `lib/i18n.ts`: typed English, Chinese, French, and Spanish dictionaries;
- `db/` and `drizzle/`: D1 schema and migration;
- `app/globals.css`: retained and expanded Tech Echo design system;
- `public/assets/`: retained production logo, project marks, fonts, and OG image.

## Internationalization

The copied-language-page model was replaced by one typed dictionary structure.
Public locale selection is held in a SameSite cookie. Authenticated selection is
also persisted as `members.preferred_locale`, and it controls gateway,
onboarding, navigation, forum, settings, loading, empty, error, and validation
messages. Forum content is never translated or duplicated; every language shares
the same feed and categories.

## Security properties

- server-only OAuth exchange, refresh, GraphQL calls, and database access;
- stable GitHub numeric and node IDs rather than mutable usernames;
- PKCE S256, random state, ten-minute one-use OAuth transaction;
- encrypted GitHub access/refresh tokens and hashed opaque sessions;
- HttpOnly, SameSite=Lax cookies and production `__Host-` names with Secure;
- exact-origin and HMAC CSRF validation on state-changing requests;
- Zod length/shape checks and dynamic category allowlisting;
- fixed GitHub repository target plus numeric repository verification;
- member and anonymized-IP rate limits for discussions, comments, and reactions;
- reaction targets verified against the requested discussion;
- Markdown rendered with raw HTML disabled and safe external-link attributes;
- CSP, frame denial, MIME sniffing denial, restrictive permissions policy,
  referrer policy, and HSTS;
- no post body, token, cookie, or secret logging.

The content security policy currently permits inline framework script/style
execution required by the Vinext RSC output. This is narrower than an unrestricted
origin policy but can be tightened with nonces when the runtime supports a stable
nonce pipeline.

## Automated verification completed

- TypeScript: `tsc --noEmit`
- Lint: `npm run lint`
- Unit/security tests: `npm test`
- Production build: `npm run build`
- Production dependency audit: `npm audit --omit=dev`
- Browser checks at desktop and 390px mobile width
- Public-route, missing-auth-configuration, locale-switch, responsive overflow,
  and security-header checks

The unit suite covers permanent number formatting, cryptography and tamper
failure, input limits, and Markdown script/URL safety.

## Known limitations

- Production GitHub write acceptance must be repeated after any OAuth, GitHub
  App permission, or forum-mutation change; credentials remain outside source.
- The forum repository is public. Tech Echo authentication controls this website,
  not direct public participation on GitHub.
- Direct GitHub participants who have not joined Tech Echo have no Member Number.
- GitHub's Contributors API reports linked GitHub accounts rather than anonymous
  commits. The website caps a repository response at 1,000 accounts and marks a
  result partial when GitHub indicates another page.
- Atlas Physicus is classified as Noah `#001`'s Member Project by explicit project
  direction for this release. Its own README/CITATION metadata should be aligned
  with that attribution so every canonical surface says the same thing.
- The organization README remains canonical for collective identity and
  philosophy, but parts of its status section lag the live website. The About
  page labels current project and permission material separately as website
  policy instead of attributing it to the pinned README revision.
- The first 50 comments and 25 discussions per page are loaded in v0.1;
  the feed supports cursor pagination.
- Nested replies, editing, deletion, moderation tooling, and search are deferred.
- Privacy and terms copy are a technically accurate launch draft and require the
  organization's legal review.

## Intentionally deferred beyond v0.2

- optional Translate / Show Original;
- discussion language labels;
- nested comment replies;
- editing and deletion through the Tech Echo UI;
- GitHub authorization-revocation webhook handling;
- administrator category/membership tooling;
- stronger edge-level anti-spam and moderation surfaces;
- custom-domain SEO transition validation after the final domain is selected.
