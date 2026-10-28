# Dependency advisory review

**Review date:** 2026-10-27
**Scope:** production dependencies reported by `npm audit --omit=dev`
**Decision:** do not run `npm audit fix --force` without a compatibility review.

## Verification run — 2026-10-27

`npm audit --omit=dev --audit-level=high` now reports two moderate React Router advisories. The static glossary no longer depends on `zod`, and the write-only XLSX export no longer depends on `xlsx`; both replacements are covered by tests. The remaining audit remediation requires a breaking React Router 7 upgrade and is kept isolated from this branch.

## Current findings

| Dependency | Current use | Audit status | Current disposition |
|---|---|---|---|
| XLSX export | Dependency-free client-side write-only OOXML export | No production package dependency | Generates only the four required export sheets, never parses workbooks, and is covered by export-service tests. |
| `zod` | Previously used only for bundled glossary data | Resolved locally | Removed the unnecessary production dependency and replaced it with a narrow validator that rejects malformed bundled data; no user input is parsed through this path. |
| `react-router` / `react-router-dom@6.30.6` | Application and public routing | Moderate advisories; remediation requires a major-version review | No forced upgrade. Review v7 migration compatibility separately because routing is a core application boundary. |

## Controls already in place

- The lockfile is tracked and uses package integrity metadata.
- No Git-based package dependencies or install scripts were found in the audited production dependency tree.
- The XLSX exporter is dependency-free and writes only sanitized application data; the application does not parse user-provided workbooks.
- `zod` validates bundled static glossary data rather than network or user-provided payloads.
- Router destinations are literal or same-origin validated before navigation.
- CI now exposes the reproducible public-output verifier through `npm run verify:public`.
- CI can run the real-404 Cloudflare verifier when `CLOUDFLARE_STAGING_URL` is configured.

## Required next review

1. Review the React Router major-version migration guide and update only with explicit compatibility evidence.
2. Run the full test/build/public-build suite against any router candidate.
3. Re-run `npm audit --omit=dev --audit-level=high` after each candidate change.

The React Router compatibility spike is documented in `docs/security/react-router-v7-compatibility.md`. It is intentionally not merged into the current branch because routing and authentication are core application boundaries.

This document records risk treatment; the XLSX advisory is remediated locally, while the React Router advisories remain open pending a separately reviewed major-version migration.
