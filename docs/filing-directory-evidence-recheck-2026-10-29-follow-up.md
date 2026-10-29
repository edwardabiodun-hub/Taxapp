# Filing-directory evidence follow-up — 2026-10-29

## Scope and evidence rule

This is a conservative public-source discovery and controlled-workflow pass for the filing-directory backlog. It records what official or apparently official portals publicly describe; it does **not** establish authority acceptance unless the workflow exposes a successful submission acknowledgement. No credentials were created, no personal data was entered, no form was submitted, and no row in `docs/filing-directory-evidence-register.csv` was changed.

To promote a jurisdiction from `not_verified`, FileSmart still needs current-period workflow evidence, an identifiable official endpoint, confirmation of the relevant individual PIT return type, and a second review.

## Findings

| Jurisdiction | Official/public source | Observation | Conservative interpretation | Register status |
|---|---|---|---|---|
| Bayelsa | [Bayelsa State Board of Internal Revenue](https://bir.by.gov.ng/) and [Bayelsa eTax](https://etax.bir.by.gov.ng/) | The official BIR site explicitly says “File Individual Tax Returns Online With Ease,” gives a four-step path (personal profile → Tax Returns → File Returns → Submit), and separately advertises annual-returns e-filing. The linked eTax portal exposes an individual self-assessment flow with income inputs and a next-step control, plus sign-up/login and annual-return language. | Strongest current evidence in this pass for an individual online-return experience. It still does not prove a completed current-period Form A submission, generated acknowledgement, or authority acceptance because no personal test return was submitted. | `not_verified` |
| Benue | [Benue State Internal Revenue Service taxpayer portal](https://birs.be.gov.ng/) | The official host returned a 200 Angular application shell during controlled inspection, but the rendered page did not expose accessible filing workflow text or a public individual-return path in the unauthenticated session. | The public claim remains insufficient for individual PIT workflow confirmation. Do not infer filing capability from an app shell or from an unverified claim. | `not_verified` |
| Taraba | [Taraba State Board of Internal Revenue portal](https://tarababirs.revco.ng/) and [Taraba State IRS](https://irs.tr.gov.ng/) | The public portal exposes registration, login, self-assessment, invoice generation, payment, receipt validation, and transaction-history language. It explicitly describes access for individuals and corporate users, but no annual-return filing control was exposed in the unauthenticated flow. | Evidence supports online registration, assessment, invoicing, and payment capabilities. It does not establish that an individual annual PIT return can be submitted online without an offline step. | `not_verified` |

## Additional discovery lead not admitted as official evidence

[PlateauIGR's tax-filing page](https://www.plateauigr.com/filetax.html) exposes a detailed PIT-return form with TIN, occupation, residential address, income sources, document upload, and a “Generate Reference Number” action. The page is useful for future workflow review, but its domain is not a `.gov.ng` government domain and its official ownership was not independently confirmed in this pass. It must not be used to promote Plateau's public status.

## Follow-up queue

1. Obtain a second reviewer for Bayelsa's individual-return evidence and, if authorized test credentials become available, capture the assessment period, final submission acknowledgement, and whether the process is a true filing or only an upload/payment request.
2. Obtain an authenticated or official support-assisted Benue workflow capture and identify whether the return is individual PIT, PAYE/employer, business, or another tax type.
3. Resolve Taraba's annual-return path through an official guide or support-assisted workflow; do not infer it from the self-assessment and payment features.
4. Obtain a second reviewer for any evidence considered for publication.

## Decision

No public status changed. These sources narrow the next validation queue, but they are not sufficient evidence for a direct filing claim, an API claim, or an authority-acceptance claim.
