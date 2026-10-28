# Filing-directory evidence discovery — 2026-10-27

## Purpose

This is a research register, not a publication approval. The public filing directory must continue to show `Not verified yet` until each candidate has a second reviewer, a current service-period check, and complete evidence metadata in the controlled register.

## Candidate findings

| Jurisdiction | Online tax service found | Individual PIT filing found | Evidence and interpretation | Current publication decision |
|---|---:|---:|---|---|
| Lagos | Yes | Yes | LIRS eTax describes online filing for individuals and returns filing. Source: https://etax.lirs.net/ | Keep public row unverified pending dated review and confirmation of the 2026 workflow. |
| Ogun | Yes | Yes | Ogun's official self-service FAQ lists Form A returns and individual payer registration. Source: https://applications.ogunstaterevenue.com/SelfService/ | Strong candidate; confirm current live Form A submission flow and review date before publication. |
| Osun | Partial | Not confirmed | An official Osun Form A/direct-assessment document was found, but it does not by itself prove online submission. Source: https://irs.os.gov.ng/wp-content/uploads/Direct-Assessment-Form-A-Tax-Computation-Table.pdf | Keep unverified. |
| Oyo | Yes | Not confirmed | The official self-service portal exposes `File Tax Returns`, but its guidance says self-employed users file with the relevant tax office; the individual electronic workflow needs confirmation. Source: https://selfservice.oyostatebir.com/ | Keep unverified. |
| Anambra | Yes | Yes | Official AIRS material states that individual returns can be filed through the approved electronic platform, and the official portal provides taxpayer access. Sources: https://anambrastate.gov.ng/tag/airs-extends-deadline-for-filing-of-tax-returns/ and https://tax.services.an.gov.ng/ | Strong candidate; confirm current 2026 workflow and attach dated evidence. |
| Kano | Yes | Yes | KIRS provides an individual tax-return guide and an individual taxpayer self-service portal. Sources: https://www.kirs.gov.ng/ and https://etax.kirs.gov.ng/ | Strong candidate; confirm the current return submission path and review date. |
| FCT | Yes | Yes | FCT-IRS publishes step-by-step instructions for filing returns through its self-service portal, including `Tax Returns` → `File Returns` → `File a New Return`. Source: https://fctirs.gov.ng/howto/steps-on-filling-return/ | Strong candidate; confirm current portal availability and 2026 rules. |
| Rivers | Yes | Yes | RIVTAMIS describes individual registration and Direct Assessment, including online submission steps. Source: https://riversbirs.gov.ng/ | Strong candidate; confirm source availability after the timeout encountered during retrieval. |
| Edo | Yes | Yes | ERAS states that individuals can access personal income, returns, receipts and compliance tools and displays an open PIT filing window. Source: https://eras.eirs.gov.ng/ | Strong candidate; confirm authenticated return workflow and dated review. |
| Kwara | Yes | Yes | KWIRS states that individual annual returns may be filled and submitted online through its self-service portal. Source: https://irs.kw.gov.ng/article/filing-of-individual-annual-tax-returns | Strong candidate; source is older and requires a current-period recheck. |
| Delta | Yes | Partial | Delta's official portal and self-service materials expose `File Tax Returns` and individual/self-employed access, but the retrieved guidance also directs self-employed users to the relevant tax office after filing. Source: https://deltairs.com/ and https://selfservice.deltairs.com/ | Keep unverified pending confirmation of the actual online individual PIT submission workflow. |
| Plateau | Yes | Not confirmed | The official PSIRS portal supports individual registration and taxpayer access, but the retrieved page did not confirm individual PIT submission. Source: https://piras.psirs.gov.ng/ | Keep unverified. |

## Evidence standard applied

- An official portal or registration page is evidence of an online tax service, not automatically evidence of individual PIT filing.
- A form, payment page, TIN registration page, or deadline notice is not sufficient to mark individual PIT submission as confirmed.
- Publication requires a current official source, the exact workflow or explicit filing statement, a review date, named reviewer, service period, confidence, and limitations.
- No portal credentials were collected, no forms were submitted, and no authority API was accessed.

## Next research queue

1. Recheck the strong candidates during a controlled current-period review.
2. Investigate the remaining jurisdictions one at a time using official IRS or state-government sources.
3. Add evidence metadata to `docs/filing-directory-evidence-register.csv` only after second review.
4. Promote a row to the application registry only through the evidence contract in `src/domain/filing-directory.ts`.

## Additional official-source discovery — 2026-10-27

This pass screened additional state-government and state-revenue sources. These are still discovery candidates only. None of the findings below changes the controlled register or the public directory, because the evidence contract requires a current dated review and second-person verification.

| Jurisdiction | Online tax service found | Individual PIT filing found | Evidence and interpretation | Current publication decision |
|---|---:|---:|---|---|
| Bayelsa | Partial | Not confirmed | The state government service directory advertises online TIN and tax-clearance services, but does not show an individual PIT return workflow. Source: https://bayelsastate.gov.ng/services/ | Keep unverified. |
| Cross River | Yes | Partial | The official IRS site references a PAYE filing module and an assessment guide, while the state government material describes self-assessment and tax-payment services. The retrieved evidence does not establish end-to-end annual individual PIT submission. Sources: https://crirs.crossriverstate.gov.ng/ and https://crirs.crossriverstate.gov.ng/assessment-guide | Keep unverified pending an authenticated annual-return workflow review. |
| Enugu | Yes | Not confirmed | The official IRS site supports individual sign-up, online payment, and describes Direct Assessment/Form A obligations. It does not clearly document that an individual can submit the annual PIT return entirely online. Sources: https://irs.en.gov.ng/tax-type and https://irs.en.gov.ng/ | Keep unverified. |
| Ekiti | Yes | Not confirmed | The official IRS site says self-assessed taxpayers can assess themselves and pay online, but the retrieved page does not explicitly confirm online individual PIT return submission. Source: https://irs.ekitistate.gov.ng/ | Keep unverified. |
| Kaduna | Yes | Yes — candidate | The official KADIRS portal states that taxpayers can submit annual income-tax returns digitally and includes a `File Tax Returns` service. The portal content contains placeholder-looking metrics, so the actual workflow and current service period require direct confirmation. Source: https://kadirs.kdsg.gov.ng/ | Strong candidate; do not publish until workflow and evidence date are independently verified. |
| Jigawa | Yes | Yes — candidate | The official JIGTAS portal explicitly lists electronic annual tax-return filing. A separate state-government procedure document emphasizes invoice generation and payment, so filing and payment should not be conflated. Sources: https://jigtas.jigawastate.gov.ng/ and https://www.jigawastate.gov.ng/uploads/Procedures%20for%20obtaining%20TIN%20and%20tax%20payment.pdf | Strong candidate; confirm the live annual-return form and individual PIT scope. |

### Jurisdictions requiring a targeted source-owner follow-up

No reliable official individual-PIT filing evidence was located in this search pass for Abia, Adamawa, Akwa Ibom, Bauchi, Benue, Borno, Ebonyi, Gombe, Imo, Katsina, Kebbi, Kogi, Nasarawa, Niger, Ondo, Sokoto, Taraba, Yobe, or Zamfara. This is an evidence gap, not a finding that the services do not exist. The next pass should start from each state's official government domain or revenue-service contact and capture the exact portal, workflow, date, and service scope.
