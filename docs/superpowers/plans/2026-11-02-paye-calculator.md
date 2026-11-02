# FileSmart PAYE Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an employee-first public PAYE calculator that estimates 2026 annual and monthly PAYE, estimated take-home, and balance after PAYE credits without duplicating FileSmart's tax rules.

**Architecture:** Add a pure adapter in `src/lib/paye-calculator.ts` that converts monthly employee inputs into the existing `NigeriaDeclarationForm` and delegates all statutory computation to `calculateNigeriaTax`. Add a dedicated `PayeCalculator` page at `/paye-calculator` with FileSmart's existing public navigation/footer, live inputs, responsive result panel, disclaimers, and an internal link from the existing tax calculator. No employer payroll mode or new tax-rule profile is introduced.

**Tech Stack:** React, TypeScript, React Router, Tailwind CSS, Vitest, Testing Library, Vite public prerendering.

**Spec:** Approved employee-first PAYE calculator prompt and competitor review at `https://taxjeje.com/paye-calculator`.

## Global Constraints

- Reuse the existing Nigeria Tax Act 2025 2026 calculation profile; do not create a second band or deduction engine.
- Keep the tool public, client-side, and non-submitting; do not send salary or deduction values to analytics or an API.
- Use actual payslip contribution amounts; do not silently assume competitor-specific contribution rates.
- Keep results labelled as estimates, not final tax payable or government assessments.
- Preserve the existing `/calculator` behavior and current launch-phase filing gate.
- Support only tax year 2026 until another tax-year profile is separately reviewed.
- Do not add dependencies, secrets, employer payroll calculations, or state-specific tax adjustments.

## Review Focus

- Empty and zero-income input must show an explanatory empty state and no false PAYE result; cover in the page test.
- Invalid, negative, comma-formatted, and decimal money values must be rejected or normalized consistently; cover in the adapter test.
- PAYE credit must reduce the estimated balance without reducing computed annual PAYE; cover in the adapter test.
- Rent relief and documented employee deductions must flow through the shared calculator exactly once; cover in the adapter test.
- The public route must be prerendered with unique title, description, canonical URL, and an accessible result panel; cover in route/page tests and public verification.

### Task 1: Extract reusable money-input formatting

**Files:**
- Create: `src/lib/money-input.ts`
- Test: `src/lib/money-input.test.ts`
- Modify: `src/pages/TaxCalculator.tsx`

**Interfaces:**
- Produces `formatMoneyInput(value: string): string`, preserving the current comma and two-decimal behavior used by the existing calculator.

- [ ] **Step 1: Write the failing test** for grouping integer input, preserving decimals, stripping invalid characters, and handling empty input.
- [ ] **Step 2: Run `npm exec vitest run src/lib/money-input.test.ts` and verify it fails because the helper does not exist.**
- [ ] **Step 3: Implement `formatMoneyInput` in `src/lib/money-input.ts` and import it from `TaxCalculator.tsx`.**
- [ ] **Step 4: Run the focused test and the existing calculator test; verify both pass.**
- [ ] **Step 5: Commit with `refactor: share money input formatting`.**

### Task 2: Add the pure PAYE calculation adapter

**Files:**
- Create: `src/lib/paye-calculator.ts`
- Test: `src/lib/paye-calculator.test.ts`

**Interfaces:**
- Consumes `calculateNigeriaTax`, `TaxEstimateUnavailableError`, `NigeriaDeclarationForm`, and the existing rent-relief/tax baseline modules.
- Produces `PayeCalculatorInput` with monthly gross salary, monthly commissions, monthly bonuses, monthly allowances, monthly pension, monthly NHF, monthly NHIS, annual rent, qualifying 2025 life-insurance/deferred-annuity premium, and monthly PAYE already suffered, all as strings.
- Produces `calculatePayeEstimate(input: PayeCalculatorInput): PayeCalculationResult` with annual gross income, annual computed PAYE, monthly PAYE equivalent, annual PAYE credit, balance after credit, monthly employee contributions, estimated monthly take-home, effective rate, tax-band breakdown, warnings, and shared calculation metadata.

- [ ] **Step 1: Write failing tests** for a basic monthly salary, monthly-to-annual conversion, actual contribution deductions, rent relief, PAYE credit, zero income, invalid input, and a boundary case at ₦800,000 annual taxable income.
- [ ] **Step 2: Run `npm exec vitest run src/lib/paye-calculator.test.ts` and verify the tests fail for the missing adapter.**
- [ ] **Step 3: Implement the adapter** by converting monthly values to annual values, mapping them into `NigeriaDeclarationForm`, setting `taxYear: "2026"`, using `lifeInsurancePremiumPaidYear: "2025"` only for the dedicated qualifying-premium input, and delegating computation to `calculateNigeriaTax`.
- [ ] **Step 4: Derive monthly PAYE as computed annual tax divided by twelve, monthly contributions from the entered payslip amounts, and estimated monthly take-home from monthly gross earnings less monthly employee contributions and monthly PAYE equivalent. Keep PAYE credit separate from computed tax.**
- [ ] **Step 5: Run the focused adapter tests and the full test suite; verify they pass without changing existing tax vectors.**
- [ ] **Step 6: Commit with `feat: add shared paye calculation adapter`.**

### Task 3: Build the employee-first PAYE page

**Files:**
- Create: `src/pages/PayeCalculator.tsx`
- Test: `src/pages/PayeCalculator.test.tsx`

**Interfaces:**
- Consumes `PayeCalculatorInput`, `calculatePayeEstimate`, `formatMoneyInput`, `PublicNav`, `PublicFooter`, `setPageMetadata`, and the existing public launch-phase patterns.
- Produces a public responsive page with route-safe heading `Nigeria PAYE Calculator`, live result state, and no submission behavior.

- [ ] **Step 1: Write failing page tests** for the title/content, live calculation after monthly gross entry, thousands separators, empty state, result panel, annual/monthly PAYE, take-home, effective rate, PAYE credit balance, disclaimers, and mobile-safe accessible labels.
- [ ] **Step 2: Run `npm exec vitest run src/pages/PayeCalculator.test.tsx` and verify it fails because the page does not exist.**
- [ ] **Step 3: Implement the page** with a two-column desktop/tablet layout and stacked mobile layout. Use actual payslip amount fields for pension, NHF, NHIS, and monthly PAYE; add annual rent and qualifying insurance inputs with clear evidence hints.
- [ ] **Step 4: Add the result panel** showing annual PAYE estimate, monthly PAYE equivalent, estimated monthly take-home, effective rate, estimated balance after PAYE credit, and band breakdown. Clearly distinguish tax from employee contributions.
- [ ] **Step 5: Add copy explaining that PAYE is employer withholding, annual filing obligations may still apply, inputs stay in the page, and the result is not a final assessment.**
- [ ] **Step 6: Run the page tests and verify all accessibility labels and result states pass.**
- [ ] **Step 7: Commit with `feat: add public paye calculator page`.**

### Task 4: Register, cross-link, and make the route indexable

**Files:**
- Modify: `src/PublicApp.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/public/PublicFooter.tsx`
- Modify: `src/pages/TaxCalculator.tsx`
- Test: `src/components/public/PublicNav.test.tsx` or a focused route/navigation test

**Interfaces:**
- Consumes the completed `PayeCalculator` page and exposes `/paye-calculator` in public and development routing.

- [ ] **Step 1: Write failing route/link tests** asserting `/paye-calculator` renders the PAYE heading and the footer/existing calculator exposes a contextual PAYE-calculator link.
- [ ] **Step 2: Run the route test and verify it fails because the route/link is absent.**
- [ ] **Step 3: Add the route to both public routing surfaces and add one concise internal link without changing existing navigation labels unnecessarily.**
- [ ] **Step 4: Extend public prerender route configuration and metadata verification so `/paye-calculator/` receives a unique title, description, canonical, and sitemap entry.**
- [ ] **Step 5: Run route/link tests, `npm run build:public`, and `npm run verify:public`.**
- [ ] **Step 6: Commit with `feat: expose paye calculator route`.**

### Task 5: Full validation and handoff

**Files:**
- Modify: `docs/superpowers/implementation-status.md` only if the repository's existing tracking convention requires it.

- [ ] **Step 1: Run `npm exec vitest run src/lib/money-input.test.ts src/lib/paye-calculator.test.ts src/pages/PayeCalculator.test.tsx src/pages/TaxCalculator.test.tsx`.**
- [ ] **Step 2: Run `npm test`, `npm run lint`, `npm run build:public`, and `npm run verify:public`.**
- [ ] **Step 3: Inspect the public build for the new route, canonical, sitemap entry, and no tracked `.env`/generated output.**
- [ ] **Step 4: Open `/paye-calculator/` in the local public preview and verify desktop result placement, mobile stacking, empty state, and live calculation.**
- [ ] **Step 5: Record changed files, test results, tax assumptions, and any professional-review limitations.**

## Self-Review Notes

- No new legal tax bands or rates are introduced; the adapter delegates to the existing reviewed profile.
- Competitor-specific automatic rates are intentionally not copied because FileSmart's approved calculation contract requires documented user inputs where the payslip structure is unknown.
- Employer/payroll mode, employer remittance calculations, and state-specific adjustments are explicitly deferred.
