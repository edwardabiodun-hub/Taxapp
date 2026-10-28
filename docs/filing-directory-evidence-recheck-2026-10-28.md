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

## Additional official-source research pass — 2026-10-28

This pass extended the search to the remaining jurisdictions using official state revenue-service or state-government sources. These observations are discovery evidence only. They do not change `docs/filing-directory-evidence-register.csv` or the public directory because the evidence contract still requires a current-period check, named second reviewer, complete metadata, and confirmation that the workflow is specifically individual PIT/Form A rather than payment, registration, TCC, PAYE, or a general business-return service.

| Jurisdiction | Official source | Evidence observed | Controlled interpretation |
|---|---|---|---|
| Abia | [ABIRS FAQ](https://abiairs.gov.ng/faqs/) | The authority describes Personal Income Tax and Direct Assessment for individuals, but the retrieved page does not show an online annual-return submission sequence. | Keep unverified. Tax obligations are not proof of online filing. |
| Adamawa | [ADIRS About](https://ad-irs.adamawastate.gov.ng/about/) | The official platform says individuals can calculate, pay, and file taxes through AIRS Payments. | Strong candidate; confirm the annual individual return/Form A workflow and service period. |
| Akwa Ibom | [AKIRS portal](https://ibomtax.net/) and [individual signup](https://ibomtax.net/auth/signup) | The official portal offers an Individual taxpayer type, returns filing, and online filing language. | Strong candidate; confirm the specific annual individual PIT return sequence and current period. |
| Bauchi | [BIRS service charter](https://www.bauchistate.gov.ng/wp-content/uploads/2023/03/BIRS-SERVICE-STANDARD-AND-SERVICE-CHARTER-2022_UPDATED_V3.pdf) | The official charter says taxpayers can assess themselves, make payment, and file income-tax returns through the self-service portal. | Strong candidate; source is older and requires current workflow confirmation. |
| Benue | [BIRS taxpayer portal](https://birs.be.gov.ng/) | The official portal explicitly says individuals and businesses can file tax returns online. | Strong candidate; confirm the return type is individual PIT/Form A and capture the authenticated path. |
| Borno | [BoIRS annual-return page](https://birs.bo.gov.ng/menu/Tax-Filling/) and [FAQ](https://birs.bo.gov.ng/menu/FAQ/) | The site links Annual Returns/Tax Filling to EasyTax, but describes the annual-return service as for non-individuals/businesses. The FAQ separately discusses individual self-assessment obligations. | Keep unverified for individual PIT; do not infer individual online filing from the general portal. |
| Cross River | [CRIRS official portal](https://crirs.crossriverstate.gov.ng/) | The authority exposes a Direct Assessment filing service and a PAYE module. | Candidate for individual self-assessment, but the annual individual return sequence and current period were not captured. |
| Ebonyi | [EBSIRS official portal](https://www.tax.ebsirb.eb.gov.ng/) | The portal provides a PIT calculator, taxpayer records, payments, and annual-return language. | Keep unverified; no explicit end-to-end individual PIT submission workflow was captured. |
| Enugu | [EIRS tax types](https://www.irs.en.gov.ng/tax-type) | The official source says self-employed persons file income from the preceding year using Form A. | Keep unverified for online submission; the source confirms the obligation and form, not an online submission flow. |
| Ekiti | [EKIRS official portal](https://irs.ekitistate.gov.ng/) | The authority describes Direct Assessment and says a taxpayer can assess and pay online. | Keep unverified; online payment and assessment do not prove online return submission. |
| Gombe | [GIRS official portal](https://irs.gm.gov.ng/) and [GIRS platform](https://giras.irs.gm.gov.ng/) | The authority describes Direct Assessment, individual taxpayer registration, and online payment services. | Keep unverified; no annual individual return submission sequence was captured. |
| Imo | [IIRS services](https://www.iirs.im.gov.ng/services) and [tax forms](https://www.iirs.im.gov.ng/tax_forms) | The official service page states that annual tax returns can be filed online through the self-service portal; the forms page provides Form A. | Strong candidate; confirm current 2026 workflow and whether Form A is submitted electronically end to end. |
| Kaduna | [KADIRS e-services](https://kadirs.kdsg.gov.ng/e-services/) | The official portal describes digital annual/monthly return submission and identifies Direct Assessment for self-employed individuals. | Strong candidate; confirm current individual PIT/Form A path and review the portal directly. |
| Kebbi | [Kebbi self-service portal](https://www.pay.kebbi.revenue.ng/) | The official payment surface supports individual and corporate payer categories and online payment. | Keep unverified; payment and payer classification do not prove annual PIT return submission. |
| Kogi | [KOGIREMS guide](https://taxpayers.irs.kg.gov.ng/E-TAXGuide.pdf) and [KGIRS annual-return notice](https://irs.kg.gov.ng/kg_irs_annual_filling_notice.pdf) | Official material describes annual-return filing, says individuals can use KOGIREMS, and lists Direct Assessment among supported taxes. | Strong candidate; the available annual-return notice is older and must be rechecked for the current individual workflow. |
| Nasarawa | [NSIRS official portal](https://nirs.irs.na.gov.ng/) | The official portal provides a PIT estimator, invoices, payments, and TCC services. | Keep unverified; no online individual annual-return submission workflow was captured. |
| Niger | [NGSIRS tax types](https://www.ngsirs.gov.ng/tax-types/) and [taxpayer portal](https://nigerigr.ngsirs.gov.ng/) | The authority states that individuals must declare income and comply with filing requirements; the portal supports individual tax payments. | Keep unverified; the filing obligation and payment portal do not prove online Form A submission. |
| Ondo | [Ondo State services](https://www.ondostate.gov.ng/services) | The state portal lists online individual and business tax services and TCC processing. | Keep unverified; no individual annual PIT return workflow was identified. |
| Sokoto | [SOIRS official tax page](https://irs.sk.gov.ng/tax-matter.php) and [SOIRS mandate](https://mof.sk.gov.ng/wp-content/uploads/2025/02/Mandate-of-the-Min-of-Commerce-Tade-and-Industry-Sokoto.pdf) | Official sources describe online assessment and annual-return filing, individual registration, and a taxpayer dashboard that can file returns. | Strong candidate; confirm current portal availability and the individual PIT return path. |
| Taraba | [TSIRS annual-return guide](https://tarabastate-docs.s3.eu-central-1.amazonaws.com/guidance-and-regulations/complete-guide-to-taraba-state-taxpayer-registration.pdf) and [state portal](https://mda.tarababir.gov.ng/) | The guide states individuals must file annual returns; the portal supports individual registration and online tax payments. | Keep unverified for online PIT submission; the retrieved portal evidence is payment-focused. |
| Yobe | [YIRS official portal](https://www.irs.yb.gov.ng/) | The official site explicitly lists “Personal Income Tax Return” and says users can file annual income tax returns online. | Strong candidate; confirm the current authenticated workflow and service period. |
| Zamfara | [ZIRS official portal](https://zirs.zm.gov.ng/) | The official site advertises a self-service route to file tax returns online. | Keep unverified for individual PIT until taxpayer category and Form A scope are confirmed. |

### Research conclusion

The evidence gap is now narrowed to a smaller validation queue, but no public status is promoted in this pass. The highest-priority controlled follow-ups are Adamawa, Akwa Ibom, Bauchi, Benue, Imo, Kaduna, Kogi, Sokoto, and Yobe because official sources explicitly describe online return activity or individual filing. The remaining jurisdictions still require workflow-level evidence rather than portal or payment signals.

## Official-source refresh — October 28, 2026

A targeted search refreshed three high-priority candidates using current official pages and documents. This remains discovery evidence only; no controlled-register row was promoted.

| Jurisdiction | Official evidence refreshed | Conservative interpretation |
|---|---|---|
| Kaduna | [KADIRS e-services](https://kadirs.kdsg.gov.ng/e-services/) says taxpayers can log in with a TIN and submit annual income-tax returns, and separately identifies Direct Assessment for self-employed individuals. | Strong candidate, but the exact individual PIT/Form A workflow and current service period still require direct workflow review. Keep unverified. |
| Kogi | [KOGIREMS guide](https://taxpayers.irs.kg.gov.ng/E-TAXGuide.pdf) describes annual-return filing for individuals, and the [individual annual-return form](https://irs.kg.gov.ng/Individual_Annual_Tax_Reture_form.pdf) is issued for taxable individuals under the 2025 administration framework. | Strong evidence of an individual-return process, but the live submission path and current period still need controlled confirmation. Keep unverified. |
| Yobe | [YIRS](https://www.irs.yb.gov.ng/) explicitly lists “Personal Income Tax Return” and says users can file annual income-tax returns online. | Strong portal-level candidate, but the authenticated workflow, Form A scope, and current service period still need confirmation. Keep unverified. |

The source refresh confirms that these states should remain in the validation queue, not that they should be advertised as verified. The evidence contract still requires a dated workflow check, named second reviewer, service-period evidence, and limitations before status promotion.

## Additional official-source refresh — October 28, 2026

This follow-up pass captured additional official evidence for Bayelsa, Borno, and Cross River. It remains discovery evidence only. No row in `docs/filing-directory-evidence-register.csv` was promoted and no public filing claim was changed.

| Jurisdiction | Official evidence refreshed | Conservative interpretation |
|---|---|---|
| Bayelsa | [Bayelsa State Board of Internal Revenue](https://www.bir.by.gov.ng/) explicitly describes online individual tax-return filing, including sign-in, **Tax Returns → File Returns**, completion, and submission. The same page says the eTax portal supports annual returns and provides a template-upload option. | Strongest new candidate for controlled validation. Confirm the current 2026 service period, the exact individual PIT/Form A scope, and the authenticated workflow before promotion. Keep unverified. |
| Borno | [BoIRS FAQ](https://birs.bo.gov.ng/menu/FAQ/) explains individual self-assessment and annual filing obligations, while the [annual-return page](https://birs.bo.gov.ng/menu/Tax-Filling/) links to EasyTax but describes that service as for non-individuals/businesses. | Do not infer individual online PIT filing from the EasyTax link. Keep unverified pending an explicit individual workflow. |
| Cross River | [CRIRS](https://crirs.crossriverstate.gov.ng/) exposes Direct Assessment and PAYE modules. The official [Cross River Pay portal](https://www.crossriverpay.com/) also lists annual filing and individual taxpayer services. | Candidate for individual self-assessment, but the end-to-end annual individual PIT/Form A submission sequence and current service period remain unconfirmed. Keep unverified. |

This pass strengthens the research queue, particularly for Bayelsa, but does not satisfy the second-review and current-period requirements for publishing a verified status.

## Additional official-source research pass — 2026-10-28

This pass revisited four jurisdictions that still require workflow-level confirmation. The sources below are official revenue-service or state-government materials. They are recorded as discovery evidence only; no row in `docs/filing-directory-evidence-register.csv` was promoted and no public filing claim was changed.

| Jurisdiction | Official evidence refreshed | Conservative interpretation |
|---|---|---|
| Jigawa | [Jigawa Internal Revenue Service / JIGTAS](https://www.jirs.org.ng/) advertises electronic annual-tax-return filing, taxpayer registration, and a taxpayer portal. A separate [state procedure document](https://www.jigawastate.gov.ng/uploads/Procedure%20for%20eTCC.pdf) describes self-assessment and payment steps but does not replace workflow confirmation. | Strong candidate for online annual filing; confirm the live individual PIT/Form A route, whether submission is completed online, and the current service period. Keep unverified. |
| Katsina | The [Katsina Tax Management System](https://tms.irs.kt.gov.ng/) describes taxpayer registration, returns filing, and online filing of PIT and annual returns, including Excel upload. | Strong candidate; confirm individual PIT/Form A scope, the authenticated submission sequence, and current-period availability. Keep unverified. |
| Rivers | [Rivers TaMiS](https://riversbirs.gov.ng/) describes individual registration, Direct Assessment, annual returns, supporting-document upload, and Form H1 upload steps. | Strong candidate for an individual self-assessment workflow; confirm whether the captured annual-return path is the relevant PIT route for individuals and record the service period. Keep unverified. |
| Osun | The official [Osun Form A document](https://irs.os.gov.ng/wp-content/uploads/Direct-Assessment-Form-A-Tax-Computation-Table.pdf) confirms an individual income-tax return form, but the document itself does not prove that filing can be submitted online. | Keep unverified until an official online submission workflow is captured. Do not treat a downloadable form as e-filing evidence. |

The queue is now better prioritized for direct workflow validation, but the evidence standard remains unchanged: a dated official workflow check, named second reviewer, service-period evidence, scope limitations, and confirmation that the path is individual PIT/Form A rather than registration, payment, PAYE, TCC, or a general business-return service.
