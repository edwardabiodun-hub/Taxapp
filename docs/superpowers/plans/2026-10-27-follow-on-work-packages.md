# Follow-on Work Packages — 2026-10-27

## Scope

Continue the approved local implementation on `codex/public-seo-conversion` after the public SEO/rendering work. Keep production, database migrations, credentials, tax-rule changes, legal wording, and deployment out of scope.

## Batches

### Batch F — Evidence and governance (`READY_FOR_REVIEW`)

- Add a repository-grounded architecture/audit report.
- Record completed capabilities and unresolved external approvals.
- Acceptance: every claim is classified and points to repository evidence or is explicitly marked unverified/blocked.

### Batch G — Privacy-safe measurement (`READY_FOR_REVIEW`)

- Add an allowlisted event contract that accepts only product interaction metadata.
- Ensure financial values, tax IDs, document names, receipt content, emails, and free-form text cannot enter event payloads.
- Emit browser-local events only; no provider, network endpoint, or production activation is added.
- Acceptance: event schema tests reject sensitive keys and calculator events carry only approved route/action metadata.

### Batch H — Calculator UX hardening (`READY_FOR_REVIEW`)

- Improve numeric input semantics and accessible descriptions.
- Preserve the shared calculator and all 2026 tax formulas.
- Add tests for invalid amount feedback, result clearing, and the no-submission launch behavior.
- Acceptance: no tax calculation output changes; calculator remains public and never submits.

### Batch I — Filing-directory foundation (`READY_FOR_REVIEW`)

- Reuse the existing jurisdiction capability registry and deadline evidence model.
- Add source-verification documentation and regression checks for conservative readiness labels.
- Do not invent state portal URLs, API availability, or accepted templates.
- Acceptance: unsupported states remain generic-export only and no state is presented as direct filing without evidence.

### Batch J — Quality gates (`COMPLETE`)

- Run full tests, public build, standard build, typecheck, lint, diff check, and static-output checks.
- Confirm generated artifacts and environment files are not tracked.
- Keep Cloudflare validation listed as a staging follow-up.

## Dependency order

Batch F -> Batches G and H in parallel -> Batch I -> Batch J.
