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

## Current-source refresh — 2026-10-29

This refresh used official revenue-service or state-government sources only. It remains discovery evidence; no credentials were used, no personal data was entered, no return was submitted, and no public directory status was changed.

| Jurisdiction | Official/public source | Observation | Conservative interpretation | Register status |
|---|---|---|---|---|
| Delta | [Delta IRS portal](https://deltairs.com/), [Delta self-service portal](https://selfservice.deltairs.com/), and [Delta State BERAP progress report](https://www.deltastate.gov.ng/wp-content/uploads/2024/07/Delta-State-2023-BERAP-Implementation-Progress-Report-1.pdf) | The official portal exposes **File Tax Returns**. The self-service portal exposes **File Tax Returns** alongside S-TIN registration and taxpayer-page access. The state progress report describes the system as active for uploading/filing annual returns and identifies self-employed and employee taxpayer profiles. | Strong discovery lead for an online filing workflow. It still requires a controlled current-period individual PIT/Form A workflow check and second review before promotion. | `not_verified` |
| Ekiti | [Ekiti State IRS](https://irs.ekitistate.gov.ng/) and [Ekiti Revenue Administration Bill 2025](https://ekitistate.gov.ng/wp-content/uploads/saber/New/Revenue_Administration_Bill_2025.pdf) | The official IRS site exposes **Direct Assessment** and says taxpayers can self-assess and pay online or at designated banks. The bill describes individual annual-return obligations, but the public pages reviewed did not expose an authenticated online individual-return submission sequence. | Evidence supports direct-assessment education and payment, not confirmed online individual PIT submission. | `not_verified` |
| Gombe | [Gombe State Internal Revenue Service](https://irs.gm.gov.ng/) | The official site exposes PAYE, Direct Assessment Tax, registration, TIN, tax-clearance, and payment services. It lists Form G and Form H1 resources, but the public content reviewed did not expose an individual annual-return submission workflow. | Keep unverified; do not infer filing capability from tax-type, registration, or payment features. | `not_verified` |
| Niger | [Niger State IRS tax types](https://www.ngsirs.gov.ng/tax-types/), [Niger State IRS](https://www.ngsirs.gov.ng/), and [CBTAS Niger](https://nigerigr.ngsirs.gov.ng/) | Official materials state that individuals must declare income and comply with self-assessment/filing requirements. The linked taxpayer portal supports individual registration, invoices, payments, and transaction history, but the public workflow does not expose an annual individual PIT return submission control. | Evidence supports the obligation and online payment infrastructure, not confirmed online PIT filing. | `not_verified` |

### Research conclusion

Delta is now the highest-priority controlled validation candidate because multiple official sources describe a filing function and the state report records annual-return upload/filing as active. Ekiti, Gombe, and Niger remain evidence-gap candidates. Their public evidence must not be represented as proof that a taxpayer can complete and submit an individual PIT return online.

## Current-source refresh — additional queue — 2026-10-29

This additional pass reviewed the next evidence queue using official revenue-service or government sources. These are discovery findings only. No credentials were used, no personal data was entered, no return was submitted, and no public directory status was changed.

| Jurisdiction | Official/public source | Observation | Conservative interpretation | Register status |
|---|---|---|---|---|
| Adamawa | [Adamawa IRS payment platform](https://ad-irs.adamawastate.gov.ng/) | The official platform describes tax, licence, and government-service payments, e-receipts, registration, and payment history for individuals and businesses. | Payment infrastructure only; no individual annual PIT return submission workflow was exposed. | `not_verified` |
| Akwa Ibom | [AKIRS official site](https://www.akirs.ak.gov.ng/), [AKIRS FAQ](https://www.akirs.ak.gov.ng/faqs), and [AKIRS annual-return notice](https://mail.akirs.ak.gov.ng/news/akirs-to-business-owners-file-your-annual-returns-of-income-from-all-business-sources) | The official site references employer annual returns. The FAQ describes self-assessment, payment, and e-TCC; the annual-return notice directs business owners to the website or a tax office for forms. | Evidence supports assessment, payment, and employer/business-return activity, but not a confirmed self-service individual PIT/Form A submission path. | `not_verified` |
| Bauchi | [Bauchi State service charter](https://www.bauchistate.gov.ng/wp-content/uploads/2023/03/BIRS-SERVICE-STANDARD-AND-SERVICE-CHARTER-2022_UPDATED_V3.pdf) and [Bauchi taxpayer platform](https://bipa.bauchistate.gov.ng/) | The official service charter says taxpayers can assess themselves, pay, and file income-tax returns for review through the self-service portal. The newer state platform advertises assessment filing and a unified taxpayer account. | Strong discovery lead for online filing, but the available evidence is not a current 2026 workflow capture and does not identify individual PIT/Form A submission completion. | `not_verified` |
| Imo | [Imo IRS FAQ](https://www.iirs.im.gov.ng/faq), [IIRS self-service portal](https://iirs.fenixrms.com/), and [official Form A](https://iirs.im.gov.ng/document/docs/forms/form%20a.pdf) | Official sources describe self-assessment, annual-return obligations, and a self-service portal advertising “Returns/e-Filing.” The official Form A is available for individual income returns. | Strong candidate for controlled validation. Confirm that the current portal accepts individual PIT/Form A data and produces a submission acknowledgement. | `not_verified` |
| Kaduna | [KADIRS official portal](https://kadirs.kdsg.gov.ng/?cp=3) and [Kaduna State government](https://kdsg.gov.ng/) | KADIRS states that taxpayers can submit annual or monthly returns and financial declarations digitally. The state government separately directs taxpayers to KADIRS for filing and payment. | Strong online-filing claim, but the public text does not establish the individual PIT/Form A workflow or a successful acknowledgement. | `not_verified` |
| Kogi | [Kogi IRS annual-filing notice](https://irs.kg.gov.ng/kg_irs_annual_filling_notice.pdf) and [Kogi taxpayer guide](https://taxpayers.irs.kg.gov.ng/E-TAXGuide.pdf) | The official notice documents online annual-return upload through the taxpayer portal, but the described 2024 process is specifically employer PAYE returns. The guide exposes an Annual Returns module but does not identify the individual PIT/Form A path. | Evidence supports online annual-return capability, not confirmed individual PIT submission. | `not_verified` |
| Sokoto | [Sokoto IRS](https://irs.sk.gov.ng/), [Sokoto e-Tax portal](https://soirs.igrcollection.com/eregistration/), and [official service description](https://mof.sk.gov.ng/wp-content/uploads/2025/02/Mandate-of-the-Min-of-Commerce-Tade-and-Industry-Sokoto.pdf) | Official materials describe online assessment and annual-return filing. The e-Tax portal exposes individual taxpayer registration, while the service description says account holders can calculate, assess, pay, and file returns. | Strong discovery lead, but the current individual return type, current tax-year availability, and successful submission acknowledgement still require controlled validation. | `not_verified` |
| Yobe | [Yobe State IRS](https://irs.yb.gov.ng/) and [Yobe documents](https://www.irs.yb.gov.ng/documents) | The official site explicitly lists “Personal Income Tax Return” and says users can file annual income-tax returns online. It also exposes taxpayer, payment, and tax-clearance portals. | Strong public filing claim, but no unauthenticated individual Form A workflow or submission acknowledgement was captured. | `not_verified` |

### Prioritized controlled-validation queue

1. Bauchi — official service charter explicitly connects self-assessment, payment, and filing through the self-service portal.
2. Imo — current self-service portal advertises returns/e-filing and the official Form A is available.
3. Kaduna — current KADIRS portal explicitly claims digital annual-return submission.
4. Sokoto — official materials describe online annual-return filing and individual taxpayer registration.
5. Yobe — official site explicitly names personal income tax returns and online annual filing.
6. Adamawa, Akwa Ibom, and Kogi — retain as lower-priority evidence gaps because public evidence is payment, employer/PAYE, business, or general annual-return focused.

All candidates remain `not_verified` until an authorized workflow check captures the relevant individual PIT/Form A path, current assessment period, final submission acknowledgement, and second review.

## Controlled portal inspection — first validation queue — 2026-10-29

The first three candidates were inspected in a browser without creating accounts, entering personal data, or submitting forms.

| Jurisdiction | Live inspection | Result | Blocker to promotion |
|---|---|---|---|
| Bauchi | `https://mytax.birs.bu.gov.ng/login` and `/register` | The self-service portal is reachable. The registration flow begins with an explicit **Individual** taxpayer option and a multi-step **Next** control. The login page does not expose filing options before authentication. | Requires an authorized individual test account or official support-assisted walkthrough to capture annual-return type, assessment year, submission action, and acknowledgement. The alternate `bipa.bauchistate.gov.ng` host returned a certificate-name error during inspection, so it was not used as evidence. |
| Imo | `https://iirs.fenixrms.com/` and `/register` | The portal is reachable and exposes login/registration. The public landing page advertises **Returns/e-Filling**, but the registration form requires personal identity and contact data before access to the dashboard. | Requires an authorized account or official support-assisted walkthrough to verify individual PIT/Form A, current year, and successful submission acknowledgement. |
| Kaduna | `https://kadirs.kdsg.gov.ng/` and `/e-services/` | The official site publicly claims **File Tax Returns** and says annual or monthly returns can be submitted digitally. The e-services page links back to the same generic service surface; no individual return form, login-to-filing path, assessment-year selector, or acknowledgement was exposed. | Requires the actual linked taxpayer service endpoint or an authorized/support-assisted workflow capture. Public marketing copy alone is insufficient for verification. |

### Controlled-validation decision

The first queue is now narrowed to three concrete access requests, but none can be promoted without an authenticated or support-assisted workflow. No credentials, personal taxpayer information, payments, or submissions were used. All public statuses remain `not_verified`.
