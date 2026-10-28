# Filing-directory evidence recheck — 2026-10-28

## Scope

This is a dated research checkpoint against official authority sources. It does not promote any row in `docs/filing-directory-evidence-register.csv` and does not change the public directory. Promotion still requires complete metadata and second review under `docs/filing-directory-source-verification.md`.

## Observations

| Jurisdiction | Official source checked | Observation | Controlled status |
|---|---|---|---|
| FCT | [FCT-IRS filing instructions](https://fctirs.gov.ng/howto/steps-on-filling-return/) | The authority instructs users to sign in to the self-service portal, choose **Tax Returns → File Returns → File a New Return**, enter the assessment year, complete the assessment sections, and submit for approval. This is direct evidence of an online return workflow, but the page does not independently distinguish every individual PIT category or confirm the 2026 service period. | Keep `not_verified` pending second review and current-period confirmation. |
| Oyo | [Oyo State Revenue self-service portal](https://selfservice.oyostatebir.com/) | The official portal exposes **File Tax Returns** and individual taxpayer registration. Its own guidance separately says self-employed users should file annual returns with the relevant tax office, so the portal surface alone does not prove end-to-end online individual PIT submission. | Keep `not_verified`. |
| Ogun | [Ogun State Revenue self-service portal](https://applications.ogunstaterevenue.com/SelfService/) | The official portal timed out during this recheck. No new evidence was captured and no status was changed. | Keep `not_verified`. |
| Anambra | [Anambra State IRS portal](https://tax.services.an.gov.ng/) | The official portal was reachable but exposed only the AIRS logo to the text inspection tool; no filing-service description could be independently captured. | Keep `not_verified`. |
| Lagos | [LIRS e-Tax](https://etax.lirs.net/) | The official platform states that users can file returns online and separately describes the service for individuals, including calculate, pay, and file functions. This is strong direct evidence of individual online tax filing, but the current 2026 service-period scope still needs a controlled second review. | Keep `not_verified` pending second review. |
| Kano | [KIRS taxpayer portal](https://etax.kirs.gov.ng/) | The official portal offers an Individual category for persons with NIN and a taxpayer login. The portal categorization supports an individual taxpayer service, but the annual PIT/Form A submission sequence was not captured in the accessible page content. | Keep `not_verified`. |
| Edo | [ERAS](https://eras.eirs.gov.ng/) | The official portal identifies individual personal-income, returns, receipts, and compliance tools, and displays a current personal-income-tax filing window. The authenticated filing sequence was not tested. | Keep `not_verified` pending second review. |
| Kwara | [KWIRS individual annual-return guidance](https://irs.kw.gov.ng/article/filing-of-individual-annual-tax-returns) | KWIRS explicitly states that individuals can fill and submit Form A online through its self-service portal. The source is older and must be rechecked against the current tax year before publication. | Keep `not_verified` pending current-period confirmation and second review. |

## Interpretation

The FCT result is the strongest current candidate for a future verified row because the authority publishes a concrete online filing sequence. It is not promoted here because the evidence contract requires a dated service-period review, reviewer identity, limitations, and second-person confirmation. Oyo demonstrates why a portal menu and an individual registration form must not be treated as proof of online individual PIT submission.

No credentials were entered, no forms were submitted, no API access was requested, and no production registry or public claim was changed.
