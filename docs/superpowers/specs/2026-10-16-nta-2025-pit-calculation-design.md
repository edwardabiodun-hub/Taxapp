# FileSmart 2026 PIT calculation design

## Intent

Replace every app-visible legacy personal income tax (PIT) calculation with a traceable implementation of the Nigeria Tax Act 2025 for the 2026 tax year. The calculation is an estimate for personal tax preparation, not an assessment, government submission, or guarantee of the amount payable.

## Confirmed product decisions

- Only tax years beginning in 2026 are in scope. Earlier years must never use the 2025 Act. The initial reviewed rule profile covers 2026; future years require a fresh rule review before numeric estimates are enabled.
- If a return includes an income or benefit that FileSmart cannot classify accurately with its available inputs, suppress the numeric estimate. The user can still save the preparation and see which details need review.
- The maximum rent **relief**, not the rent base, is ₦500,000: `min(20% × qualifying annual rent, ₦500,000)`.
- Never label a saved preparation as filed or filing-ready merely because a numerical estimate can be calculated. State portal formats and submission status remain separately gated.

## Authority and evidence

- [Nigeria Tax Act 2025, National Assembly gazette](https://nass.gov.ng/documents/download/11249), commencement clause: 1 January 2026; section 4: chargeable income categories; section 14: benefits-in-kind; sections 28–32: income, deductions and proof; section 58 and Fourth Schedule: progressive bands; section 162: exemptions.
- [Joint Revenue Board publication of the Personal Income Tax Guidelines 2026](https://www.jtb.gov.ng/media-center/jrb-releases-pit-guidelines-2026) for administration and interpretation, subordinate to the Act. The previously indexed PDF URL currently returns 404 and must be reacquired and checked before relying on it for a production release.
- [Federal Ministry of Finance transition guidance](https://finance.gov.ng/ministry/federal-government-issues-transition-guidelines-for-tax-acts-2025/) confirms pre-2026 periods remain under prior law.
- [National Pension Commission notice](https://www.pencom.gov.ng/wp-content/uploads/2024/12/Circular-on-Implementation-of-Minimum-Wage.pdf) identifies ₦70,000/month as the statutory national minimum wage used for the 2026 minimum-wage employment exemption check; recheck before enabling later years.

## Computation contract

- A single year-aware rule profile owns all rate bands, caps, effective-year metadata, and authority links. No independent tax arithmetic in review pages, PDF summaries, or state wrappers. State-specific overrides remain disabled unless backed by verified authority.
- For 2026 chargeable income, apply the Fourth Schedule marginal bands: first ₦800,000 at 0%; next ₦2,200,000 at 15%; next ₦9,000,000 at 18%; next ₦13,000,000 at 21%; next ₦25,000,000 at 23%; excess above ₦50,000,000 at 25%.
- Remove the repealed consolidated relief allowance and 1% minimum-tax floor. Do not display either in the estimator, review, export, or PDF.
- Include salary, commissions, bonuses and allowances once each. Existing `businessIncome` and `rentIncome` fields are explicitly **net** figures: do not subtract their separately recorded expense fields again. Permit actual eligible pension contributions and qualifying rent relief; do not substitute an automatically calculated 8% pension deduction for the person's actual contribution.
- Add separate annual amount inputs for actual eligible National Housing Fund and National Health Insurance Scheme contributions, qualifying interest on a loan to develop an owner-occupied residence, and qualifying life-insurance/deferred-annuity premiums. Show evidence requirements; never populate or claim them automatically. This scope was approved by the product owner.
- For a single full-year employment with total gross employment emoluments no more than the verified annualised national minimum wage, apply the Act's specific employment-income exemption. Do not assume that this exempts unrelated taxable income. If the information supplied is insufficient to establish that exemption (for example, multiple employments or part-year work), withhold the estimate rather than guess.
- Currency calculations retain kobo precision. Validate the entire amount string; malformed, negative, non-finite, contradictory, or ambiguous amounts must not silently become zero for a production estimate.
- Numeric liability is **before** PAYE, withholding-tax, and other credits not collected by the form; UI must not call it final tax payable.

## Conservative unsupported-case boundary

The current form lacks legal facts needed for employer accommodation, vehicles that may be owned or hired, foreign income and treaty relief, different classes of annuities/pensions/gratuities, many dividend/interest categories, chargeable gains, and miscellaneous investment income. Nonzero entries in these fields must produce a specific warning and no numeric estimate until a reviewed classification/input flow exists. The same rule applies when stored `bonuses` and UI `commissions` are both nonzero but cannot be confirmed as distinct payments, or when net income/expense entries are contradictory. Do not silently exclude an entered taxable amount or assume an exemption.

The basic estimator can be shown for supported salary, commission, bonus, allowance, documented net business/rental income and eligible deductions. An unentered deduction cannot be guessed or auto-claimed.

## Screens, files and exported artifacts

- Tax estimator and declaration review show the same sourced 2026 result or an explicit `Cannot estimate yet` state with reasons. A saved draft remains available in either state.
- The filing summary, state-tax wrapper, PDF, CSV and XLSX must not resurrect old arithmetic or carry a numeric PIT amount for an unsupported/pre-2026 case. Historical saved records may be opened for review but not recalculated using the new law.
- Country/tax-year selectors must not present 2023–2025 as eligible for the new calculator. Existing historical records are preserved; this work does not delete data.
- Source/version/last-reviewed information accompanies any numeric estimate. User-facing text uses `Nigeria Tax Act 2025` (not `Personal Income Tax Act 2025`) and distinguishes a tax estimate from filing.

## Out of scope and release gates

- No direct filing, payment, PAYE reconciliation, state-specific e-filing templates, or definitive legal advice.
- No deployment or push as part of the coding task without a separate explicit instruction.
- Release requires audited source-to-rule mapping, boundary tests for every band and exemption, supported/unsupported input tests, export and historical-year tests, TypeScript/lint/build/full-suite checks, and independent Nigerian tax-professional review of the calculation assumptions before presenting estimates to taxpayers.
