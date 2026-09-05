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
- Atlas Physicus availability;
- the absence of preview domains in production redirects.

GitHub Actions timing is best-effort. A future external alerting provider can use
the same health endpoint when an email, chat, or paging destination is selected.

## Automated durable identity backup

- Recovery point objective: 24 hours.
- Recovery time objective: 4 hours.
- Cadence: one encrypted durable identity snapshot per day at 02:23 Singapore time.
- Retention: 90 days in GitHub Actions artifacts.
- Restore drill: monthly, into an isolated database.

The `Encrypted production backup` workflow sends an authenticated `POST` request
to `https://techecho.org/api/ops/backup`. The route accepts only the canonical
account origin and a dedicated `BACKUP_EXPORT_TOKEN`. It reads the following in
one D1 batch transaction:

- the complete permanent Member Number allocation ledger;
- all Tech Echo member rows;
- GitHub credentials in their already encrypted-at-rest form;
- the Member Number AUTOINCREMENT high-water mark.

Sessions, cross-domain handoffs, OAuth state, pending registrations, rate limits,
and contributor cache rows are deliberately excluded. Restoring them could revive
expired authentication state; members instead sign in again after a recovery.
GitHub Discussions and source repositories remain backed by GitHub and are not
duplicated in this identity snapshot.

The workflow validates the JSON and founder `#001` invariant, compresses and
encrypts it with AES-256-GCM, decrypts and validates that ciphertext once, removes
both plaintext copies, and uploads only the authenticated `.teb` file. The
workflow and artifact are expected to be treated as public-repository metadata;
the database content is never uploaded without encryption.

Configure a GitHub environment named `production-backup`, restrict it to the
selected branch `main`, and add these environment secrets:

- `BACKUP_EXPORT_TOKEN`: the same independent random token configured as a Sites
  secret;
- `BACKUP_ENCRYPTION_KEY_V1`: exactly 32 random bytes encoded as base64.

Generate both independent values locally with `npm run backup:secrets:generate`.
It writes owner-only files under the ignored `.d1-backups/` directory and refuses
to replace existing credentials. After configuration, remove the export-token
file. Move the encryption-key value into the password manager before removing its
local file.

Keep `BACKUP_ENCRYPTION_KEY_V1` and `TOKEN_ENCRYPTION_KEY` in the organization's
password manager. GitHub secrets cannot be read back. Losing the first makes the
90-day artifacts unreadable; losing the second preserves Member Numbers but makes
the restored GitHub credentials unreadable. Never commit snapshots or keys. Keep
working files outside the checkout or under the ignored `.d1-backups/` directory,
and decrypt only on an encrypted temporary volume.

On a backup-key rotation, date-label the previous key in the password manager and
retain it until every artifact encrypted with that key has expired or been deleted
(at least 90 days after its last use). Test the first artifact made with the new
key before removing the old GitHub environment secret.

The application-level snapshot is intentionally bounded to 10,000 rows per
durable table and 20 MiB. Crossing either limit fails the workflow instead of
silently truncating data. Before approaching that size, replace this path with a
native D1 export to separately controlled object storage. D1 Time Travel remains
useful for short-window recovery but is not the 90-day off-platform copy.

After initial setup or any key rotation, manually run `Encrypted production
backup`, download the resulting artifact, and complete the verification below.
The scheduled run is successful only when an encrypted artifact exists.

GitHub schedules are best-effort: runs can be delayed or dropped under load, and
GitHub automatically disables scheduled workflows in a public repository after
60 days without repository activity. The owner must check the latest successful
`Encrypted production backup` at least weekly and re-enable the workflow after
an inactivity shutdown. Treat a snapshot older than 26 hours as an incident; a
separate external alert is still recommended.

## Verify an automated snapshot

After extracting the downloaded artifact, set the locally escrowed key without
placing it in shell history, then run:

```sh
npm run backup:snapshot:decrypt -- /absolute/path/to/backup.teb /absolute/path/to/backup.json
npm run backup:snapshot:verify -- /absolute/path/to/backup.json
npm run backup:snapshot:restore-sql -- /absolute/path/to/backup.json /absolute/path/to/restore.sql
```

The decrypt and restore tools refuse to overwrite files and create outputs with
owner-only permissions. The verifier checks the strict versioned format,
checksum, counts, unique identities, allocation links, encrypted credential
shape, high-water mark, and permanent `267296498 -> #001` binding. It prints
aggregate counts only.

Apply every migration through the snapshot's recorded schema version to a new,
isolated D1 database, then import the generated file. Never use the production
database as the first restore target:

```sh
npx wrangler d1 execute <ISOLATED_D1_DATABASE_NAME> --remote --file=/absolute/path/to/restore.sql
```

The generated file intentionally contains no `BEGIN` or `COMMIT`; D1 wraps a
file import in its own transaction. After import, verify the row counts and the
permanent `267296498 -> #001` binding before any cutover decision.

Delete the decrypted JSON and generated SQL as soon as the isolated restore drill
is complete.

## Verify a native D1 SQL export

When a native full D1 SQL export is taken separately, run the existing offline
verifier before accepting it:

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
2. Create a new isolated database. Never merge a snapshot into a populated
   database: permanent-member triggers intentionally prevent clearing or
   reassigning its ledger.
3. Apply the checked-in migrations through the snapshot's recorded schema version
   in order. Migration `0000` creates the unassigned founder `#001` reservation;
   the generated restore SQL verifies that exact fresh state before binding it.
4. Decrypt and verify the snapshot, generate its guarded restore SQL, and import
   that SQL into the isolated database. Apply every migration newer than the
   recorded version, in order, without editing migration history.
5. Export the isolated database and run the native D1 verifier. Compare aggregate
   member, allocation, credential, and high-water counts with the snapshot.
6. Confirm that sessions, session contexts, SSO handoffs, OAuth states, OAuth
   return targets, pending registrations, rate limits, and contributor cache are
   empty. They are intentionally not restored.
7. Reconnect the original `TOKEN_ENCRYPTION_KEY`, deploy the matching application
   version, and verify founder `#001`, sign-in, account/forum handoff, and a
   read-only forum page.
8. Record the result and elapsed recovery time, then securely remove plaintext
   files and the isolated drill database. Never create a disposable member
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
