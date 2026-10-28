# Filing Directory Source-Verification Workflow

## Purpose

This workflow governs any future claim that a jurisdiction offers online tax submission or confirmed individual personal income tax filing. A generic FileSmart preparation or export capability is not evidence of an authority portal connection.

## Required record

Every verified row must include:

- `jurisdictionCode` and canonical jurisdiction name from the bundled registry.
- Separate statuses for `onlineTaxSubmission` and `individualPitSubmission`.
- The exact official authority URL used for verification.
- The page or document title and the relevant service description.
- The date checked and the reviewer identity.
- The applicable tax year or service period.
- The evidence confidence and any limitations.
- A portal URL only when the official source identifies it as an intended filing route.

## Verification rules

1. Prefer an official state IRS, FCT-IRS, or other legally responsible authority source.
2. Treat online payment, employer/PAYE remittance, direct assessment, VAT, registration, and individual PIT filing as separate services.
3. Do not mark individual PIT filing as confirmed because a portal supports another tax type.
4. Do not infer API access from a public portal. API status requires documented permission, technical documentation, and an approved test path.
5. Require an HTTPS authority source. A search result, directory listing, social post, or unverified third-party article is discovery material, not confirmation.
6. Preserve the conservative `not_verified` status when evidence is missing, ambiguous, stale, or contradictory.
7. Recheck verified records at least quarterly and after a tax-law, portal, or filing-template change.

## Review and publication gate

The reviewer must attach the source evidence to the change review. A second reviewer should confirm the distinction between general online tax services and individual PIT filing before a row is published as verified. Until both checks pass, the public directory must display `Not verified yet` and FileSmart must retain its generic-export language.

## Explicit non-goals

This workflow does not authorize portal scraping, credential collection, automated filing, API access requests, or production registry updates. Those require separate security, privacy, legal, and authority approvals.
