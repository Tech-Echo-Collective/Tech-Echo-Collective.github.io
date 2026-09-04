# Changelog

## v0.2.3 — 2026-09-04

- Added a production-only, independently authenticated durable identity snapshot endpoint.
- Added a daily main-branch GitHub Actions backup that strictly verifies, AES-256-GCM encrypts, re-verifies, and retains only ciphertext for 90 days.
- Preserved Member Number allocations, the AUTOINCREMENT high-water mark, members, and already encrypted GitHub credentials while excluding all replayable session, OAuth, registration, rate-limit, and cache state.
- Added strict JSON verification, authenticated encryption/decryption tooling, fresh-database restore SQL guards, and a monthly restore-drill runbook.

## v0.2.2 — 2026-09-04

- Turned the Home orbit into six real, localized Quick Links for Profile, Projects, Members, Settings, About, and GitHub.
- Made the orbit and sidebar share one canonical symbol, label, and destination list.
- Added keyboard focus feedback, accessible names, and mobile-sized link targets without changing the dashboard hierarchy.

## v0.2.1 — 2026-09-04

- Separated GitHub identity verification from permanent Tech Echo membership creation.
- Made Sign In reject unknown GitHub identities without allocating a Member Number, storing a long-term credential, or creating a session.
- Added a 30-minute encrypted, one-use pending registration and an explicit confirmation screen before assigning a permanent Member Number.
- Made stable GitHub IDs immutable in D1 and enforced reserved identities when permanent Member rows are inserted.
- Hid legacy incomplete registrations from member directories, profiles, forum attribution, and authenticated routes while preserving their immutable numbers.
- Added a read-only production health endpoint that verifies the permanent `267296498 -> #001` binding and Member Number database triggers without exposing data.
- Added CI, dependency update checks, scheduled production smoke checks, and an offline D1 export verifier with a recovery runbook.

## v0.2.0 — 2026-08-31

- Replaced the long authenticated landing page with a single-screen Home dashboard headed by the fixed Latin statement “Sapere Aude.”
- Kept the canonical Tech Echo motto in Latin and removed localized brand-area translations.
- Added independent Projects, Project Detail, Members, and README-backed About pages.
- Added explicit Tech Echo Project, Member Project, and Collaboration classifications.
- Identified Physics Atlas as Noah #001’s independently created and maintained Member Project.
- Added text-only GitHub contributor attribution, stable numeric GitHub ID matching, and a bounded D1 cache that refreshes every six hours.
- Kept project roles separate from global community roles and GitHub permissions.
- Completed the new interface in English, Chinese, French, and Spanish.
- Preserved the existing GitHub-only account system, permanent Member Numbers, dual-domain forum handoff, and GitHub Discussions backend.

## v0.1.0 — 2026-08-31

- Production baseline for the GitHub-authenticated account system, permanent Member Numbers, multilingual member site, and GitHub Discussions forum.
