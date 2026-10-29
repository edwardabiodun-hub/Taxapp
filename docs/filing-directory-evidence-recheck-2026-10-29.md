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

## Follow-up official-source pass

This follow-up pass refreshed four additional jurisdictions using official revenue-service material. It remains discovery-only: no credentials were entered, no return was submitted, and every corresponding public registry status remains `not_verified`.

| Jurisdiction | Official source checked | Evidence observed | Conservative interpretation |
|---|---|---|---|
| Delta | [DSIRS self-service downloads](https://deltairs.com/self-service/), [DSIRS self-service portal](https://selfservice.deltairs.com/), and [individual taxpayer guidance](https://deltairs.com/personal-income-tax/) | DSIRS publishes Tax Form A, an annual tax returns data form, and annual-returns upload instructions. The official self-service FAQ says an individual payer can register and that the portal can file Form A returns. The same portal guidance also describes a self-employed route that starts with filing at the relevant tax office. | Strongest evidence in this pass for an individual-facing online Form A capability, but the current-period authenticated submission was not completed or independently confirmed. Keep `not_verified` pending a controlled workflow check and second review. |
| Ekiti | [EKIRS official home](https://irs.ekitistate.gov.ng/) | EKIRS describes direct assessment as self-assessment where a taxpayer can calculate and pay online or at designated banks, and it publishes a tax-returns-form link. The page does not expose a complete individual annual PIT/Form A submission sequence. | Evidence supports online assessment/payment and the existence of tax forms, not confirmed individual annual PIT e-filing. Keep `not_verified`. |
| Gombe | [GIRS official home](https://irs.gm.gov.ng/) and [GIRS individual self-enrolment](https://giras.irs.gm.gov.ng/) | GIRS provides individual taxpayer registration, direct-assessment information, tax calculators, and downloadable Form G/Form H1 materials. The reviewed official pages did not show a current authenticated individual annual PIT/Form A submission workflow. | Evidence supports online registration and tax-service access, but not confirmed individual annual PIT e-filing. Keep `not_verified`. |
| Niger | [NGSIRS tax types](https://www.ngsirs.gov.ng/tax-types/), [NGSIRS taxpayer rights](https://www.ngsirs.gov.ng/), and [CBTAS online portal](https://nigerigr.ngsirs.gov.ng/) | NGSIRS states that individuals must declare income and comply with filing requirements. CBTAS supports individual sign-in, TIN generation, invoices, and online payments for listed taxes. The reviewed pages did not show an individual annual PIT/Form A upload or submission workflow. | Evidence supports online taxpayer registration/payment and a filing obligation, but not confirmed online individual PIT submission. Keep `not_verified`. |

### Follow-up conclusion

Delta now has a documented, official indication of Form A capability that merits priority for controlled validation. Ekiti, Gombe, and Niger remain evidence leads rather than confirmed individual-PIT competitors because the reviewed material stops at assessment, registration, payment, forms, or general filing obligations. This distinction is intentional and prevents the directory from overstating competitor capability.
