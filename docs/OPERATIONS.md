# Tech Echo production operations

This runbook covers the identity service at `techecho.org` and the forum handoff
at `forum.techecho.org`. GitHub Discussions remains the source of truth for forum
content; D1 is the source of truth for Tech Echo membership and permanent Member
Numbers.

## Service checks

The public `GET /api/health` endpoint performs a read-only D1 readiness check. It
returns only `{"status":"ok"}` or `{"status":"unavailable"}` and never returns
member data, database errors, configuration values, or credentials.

The scheduled `Production smoke` GitHub workflow checks every 30 minutes:

- the account gateway and security headers;
- the D1 health endpoint and permanent `#001` binding;
- the canonical `www` redirect;
- the unauthenticated forum-to-account handoff without following an OAuth flow;
- Physics Atlas availability;
- the absence of preview domains in production redirects.

GitHub Actions timing is best-effort. A future external alerting provider can use
the same health endpoint when an email, chat, or paging destination is selected.

## Backup objective

- Recovery point objective: 24 hours.
- Recovery time objective: 4 hours.
- Target cadence: one encrypted D1 export per day.
- Retention: at least 30 days; 90 days preferred.
- Restore drill: monthly, into an isolated database.

Store `TOKEN_ENCRYPTION_KEY` separately from database exports. An export without
the matching key preserves Member Numbers but cannot recover GitHub credentials.
Never commit either an export or an encryption key to Git. Keep exports outside
the checkout or under the ignored `.d1-backups/` directory, and decrypt them only
on an encrypted temporary volume for verification.

Production D1 export is not automated from this repository yet. The Sites
manifest intentionally contains only the logical `DB` binding; it does not expose
a Cloudflare account ID, database ID, export credential, or encrypted backup
destination. Automation requires a dedicated least-privilege export credential
and a chosen encrypted destination. Do not substitute application logs or a copy
inside the same D1 database for a real backup.

## Verify every export

Run the offline verifier before accepting an export:

```sh
npm run backup:verify -- /absolute/path/to/d1-export.sql
```

It imports the export into an isolated in-memory SQLite database and checks:

- SQLite integrity and foreign keys;
- the durable identity tables;
- all Member Number, GitHub identity, and founder-reservation triggers;
- the permanent `267296498 -> #001` binding;
- bidirectional allocation/member links;
- the `sqlite_sequence` high-water mark.

The verifier prints aggregate counts only. It never prints member rows or
credential material.

## Restore procedure

1. Confirm the exact target environment, backup timestamp, release version, and
   rollback owner before making any production change.
2. Restore into an isolated D1 database first. Before changing its schema, run
   SQLite integrity and foreign-key checks appropriate to that backup's recorded
   release version.
3. Apply every migration newer than the export, in order, without editing applied
   migration history.
4. Run the current full export verifier and compare aggregate member/allocation
   counts with the backup record.
5. Before reopening traffic, revoke state that may have become valid again after
   the restore: sessions, session contexts, SSO handoffs, OAuth states, OAuth
   return targets, pending registrations, and rate-limit rows.
6. The GitHub contributor cache may be emptied; it will rebuild from public data.
7. Reconnect the original `TOKEN_ENCRYPTION_KEY`, deploy the matching application
   version, and verify founder `#001`, sign-in, account/forum handoff, and a
   read-only forum page.
8. Record the result and elapsed recovery time. Never create a disposable member
   in production because Member Numbers are permanent and never reused.

Production restore is intentionally never an unattended workflow. It requires
explicit confirmation of the target database and recovery point.

## Release and rollback

Before release, run `npm run verify`. After deployment, run
`npm run smoke:production`, record the released commit/tag and current Sites
version, and retain the previous known-good version as the rollback target.

OAuth or forum-write changes also require the real-account acceptance test in
`docs/DEPLOYMENT.md`. Automated monitoring must not start OAuth, create a
Discussion, reply, react, or allocate a test Member Number.
