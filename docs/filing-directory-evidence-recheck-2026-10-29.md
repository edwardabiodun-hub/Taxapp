# Filing-directory evidence recheck — 2026-10-29

## Scope

This is a dated discovery pass against official state revenue-service sources. It does not promote any row in `docs/filing-directory-evidence-register.csv` and does not change the public directory. Promotion still requires a current-period workflow check, complete evidence metadata, and second review under `docs/filing-directory-source-verification.md`.

## Official-source observations

| Jurisdiction | Official source checked | Evidence observed | Controlled interpretation |
|---|---|---|---|
| Adamawa | [ADIRS About / AIRS Payments](https://ad-irs.adamawastate.gov.ng/about/) | The official service description says individuals can calculate, pay, and file taxes through AIRS Payments. The registration and login surfaces are also available from the same official platform. | Strong candidate for online individual tax services, but the exact annual PIT/Form A workflow and current service period were not captured. Keep `not_verified`. |
| Akwa Ibom | [AKIRS portal](https://ibomtax.net/) and [individual registration](https://ibomtax.net/auth/signup) | The official portal identifies individual taxpayers, returns filing, assessments, and online filing. Its individual registration path is separately exposed. | Strong candidate, but the evidence does not yet prove the exact annual individual PIT/Form A submission sequence or current service period. Keep `not_verified`. |
| Benue | [BIRS taxpayer portal](https://birs.be.gov.ng/) | The official portal states that both individuals and businesses can file tax returns online. | Strong candidate, but the return type, individual PIT/Form A scope, authenticated submission path, and current service period remain unconfirmed. Keep `not_verified`. |
| Imo | [IIRS services](https://www.iirs.im.gov.ng/services) and [IIRS tax forms](https://www.iirs.im.gov.ng/tax_forms) | IIRS states that annual tax returns can be filed online through its self-service portal and separately publishes Form A as the income-tax return form for claims and reliefs. | Strong candidate for individual annual filing, but the live end-to-end Form A submission workflow and current service period still require controlled confirmation. Keep `not_verified`. |

## Interpretation

These sources strengthen the validation queue but do not establish that FileSmart can safely describe any of these jurisdictions as having confirmed individual PIT e-filing. Portal language can cover registration, payment, assessment, employer/PAYE returns, or business returns without proving an individual annual PIT submission flow.

No credentials were entered, no forms were submitted, no API access was requested, and no production data or public filing status was changed.

## Next controlled checks

1. Capture the current-period individual PIT/Form A workflow without submitting a return.
2. Record the exact page or portal step showing submission, not only payment or registration.
3. Add reviewer identity, review date, service period, limitations, and confidence to the evidence register.
4. Obtain second-person review before promoting any public status.
