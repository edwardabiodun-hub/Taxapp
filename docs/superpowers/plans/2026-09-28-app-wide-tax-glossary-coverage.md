# App-Wide Tax Glossary Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add accessible hover/focus definitions for recognized tax and financial terminology throughout the calculator, declaration, results, submission, and profile experiences, including the labels shown in the supplied Tax Estimator screenshot.

**Architecture:** Keep the existing validated `GlossaryText` tokenizer and `GlossaryTooltip` presentation component. Expand the dataset and apply `GlossaryText` at controlled React boundaries—shared field labels/hints, section headings, result labels, and page copy—while leaving inputs, links, buttons, code, and user-entered values untouched.

**Tech Stack:** React 18, TypeScript, Vite, Radix Tooltip, Tailwind CSS, Vitest, React Testing Library, Zod.

**Spec:** `docs/superpowers/specs/2026-09-28-tax-glossary-coverage-design.md`

## Global Constraints

- Use the existing `GlossaryTooltip` and `GlossaryText`; do not add a second tooltip implementation.
- Keep tooltip open behavior at the existing 150 ms delay with hover, focus, click/tap, and Escape support.
- Do not tokenize user-entered values, input placeholders, links, buttons, code, or file names.
- Every dataset entry must pass the existing Zod schema and include a current Nigerian tax-law statutory reference.
- Definitions must be concise plain-English copy suitable for a small tooltip and must not be presented as professional tax advice.
- Use TDD: write and run a failing test before each production behavior change.
- Preserve unrelated worktree files: `.gitignore`, `.gstack/`, `.npm-cache/`, and `handoff.md` are not part of this feature.

## Review Focus

- Exact screenshot terms such as `Annual Salary`, `Commissions & Bonuses`, `Allowances`, `Business Income (Net)`, and `Rent Income (Net)` must become triggers with the intended entry, not merely match a broader word accidentally.
- Longer phrases such as `Benefits in Kind` and `Consolidated Relief Allowance` must win over shorter aliases such as `Income` or `Allowance`.
- Labels inside inputs and buttons must remain normal text controls; no tooltip button may be nested in a `label`, `button`, or editable input region.
- Dynamic result text and declaration summaries must be annotated without tokenizing user-entered names, addresses, document names, or message bodies.
- Existing aliases, word boundaries, statutory references, keyboard focus, and Escape dismissal must continue to work after the dataset grows.

---

### Task 1: Expand the validated terminology dataset and tokenizer coverage

**Files:**
- Modify: `src/data/taxGlossary.json`
- Modify: `src/lib/glossary.test.ts`
- Test: `src/lib/glossary.test.ts`

**Interfaces:**
- Consumes: the existing `GlossaryEntry` Zod schema and `tokenizeGlossaryText` function from `src/lib/glossary.ts`.
- Produces: validated glossary entries that map the app’s visible tax/financial labels to concise definitions and statutory references.

- [ ] **Step 1: Write the failing dataset/tokenization tests**

Add a test that proves the visible calculator labels resolve to the expected glossary IDs and that the longest phrase wins:

```ts
it("recognizes calculator terminology and prefers the longest phrase", () => {
  const tokens = tokenizeGlossaryText(
    "Annual Salary, Business Income (Net), Benefits in Kind, and Consolidated Relief Allowance.",
  );

  expect(tokens.filter((token) => token.entryId).map((token) => token.entryId)).toEqual([
    "annual-salary",
    "business-income",
    "benefits-in-kind",
    "consolidated-relief-allowance",
  ]);
});
```

Add a boundary test proving a term inside a longer unrelated word is not wrapped:

```ts
it("does not match a terminology fragment inside an unrelated word", () => {
  expect(tokenizeGlossaryText("salaryman does not mean Annual Salary").filter((token) => token.entryId)).toHaveLength(1);
});
```

- [ ] **Step 2: Run the focused test and verify it fails for missing entries**

Run:

```powershell
npx vitest run src/lib/glossary.test.ts --no-file-parallelism
```

Expected: FAIL because the new IDs are not present in the current dataset.

- [ ] **Step 3: Add the exact app terminology entries**

Add entries for the following canonical terms and aliases. Use the existing current-law source URLs and references; where a UI label is a plain-language description, cite the underlying statutory category rather than inventing a standalone legal definition.

| ID | Canonical term | Required aliases | Statutory context |
| --- | --- | --- | --- |
| `annual-salary` | Annual salary | `Annual Salary`, `Salary` | Nigeria Tax Act, 2025, section 13 (employment income) |
| `commissions-and-bonuses` | Commissions and bonuses | `Commissions & Bonuses`, `Commissions`, `Bonuses` | Nigeria Tax Act, 2025, section 13 (employment income) |
| `allowances` | Allowances | `Allowance`, `Leave allowance` | Nigeria Tax Act, 2025, sections 13 and 14 (employment income and benefits) |
| `business-income` | Business income | `Business Income`, `Net Business Income`, `Business Income (Net)` | Nigeria Tax Act, 2025, sections 22 and 27 (assessable profits and total profits) |
| `rent-income` | Rent income | `Rent Income`, `Rent Income (Net)`, `Rental income` | Nigeria Tax Act, 2025, section 4(1) (income, profits or gains) |
| `foreign-income` | Foreign income | `Foreign Income`, `Income from Outside Nigeria` | Nigeria Tax Act, 2025, section 4(1) (income, profits or gains) |
| `interest-income` | Interest income | `Interest Income` | Nigeria Tax Act, 2025, section 4(1) (income, profits or gains) |
| `dividend-income` | Dividend income | `Dividend income`, `Nigerian Company Dividends`, `Other Dividends` | Nigeria Tax Administration Act, 2025, section 51 (deduction at source and franked investment income) |
| `net-income` | Net income | `Net`, `Net after expenses` | Nigeria Tax Act, 2025, sections 22 and 27 (assessable and total profits) |
| `pension-contribution` | Pension contribution | `Pension Contribution`, `Employee Pension` | Nigeria Tax Act, 2025, section 30(2) (eligible deductions) |
| `rent-relief` | Rent relief | `Rent Relief`, `Annual Rent Paid` | Nigeria Tax Act, 2025, section 30(2) (eligible deductions) |
| `gross-income` | Gross income | `Gross Income`, `Gross value` | Nigeria Tax Act, 2025, section 28 (total income) |
| `taxable-income` | Taxable income | `Taxable Income` | Nigeria Tax Act, 2025, section 30 (chargeable income) |
| `total-deductions` | Total deductions | `Deductions`, `Deductions (incl. CRA)`, `Allowable Deductions` | Nigeria Tax Act, 2025, section 30(2) (eligible deductions) |
| `consolidated-relief-allowance` | Consolidated Relief Allowance | `CRA` | Nigeria Tax Act, 2025, section 30(2) and applicable schedules |
| `minimum-tax` | Minimum tax | `Minimum Tax` | Nigeria Tax Act, 2025, section 58 and Fourth Schedule |
| `tax-estimate` | Tax estimate | `Tax Estimator`, `Tax Estimate`, `Estimated Tax Payable` | Nigeria Tax Act, 2025, section 58 and Fourth Schedule |
| `tax-year` | Tax year | `Tax Year`, `Year of assessment` | Nigeria Tax Act, 2025, section 30 and Fourth Schedule |
| `tax-declaration` | Tax declaration | `Tax Declaration`, `Declaration` | Nigeria Tax Administration Act, 2025, sections 11 to 15 (returns and filing information) |
| `tax-authority` | Tax authority | `Tax authorities`, `Relevant tax authority` | Nigeria Tax Administration Act, 2025, sections 4 and 8 |
| `tax-records` | Tax records | `Tax record`, `Records retained for tax purposes` | Nigeria Tax Administration Act, 2025, section 31 |
| `taxable` | Taxable | `Taxability` | Nigeria Tax Act, 2025, section 4(1) (income, profits or gains) |
| `exempt-income` | Exempt income | `Exempt`, `Exempted` | Nigeria Tax Act, 2025, applicable exemption provisions for the relevant income category |
| `annuity-income` | Annuity income | `Annuity Income`, `Annuity from Insurance` | Nigeria Tax Act, 2025, section 13 (employment and related income categories) |
| `gratuity` | Gratuity | `Gratuities` | Nigeria Tax Act, 2025, section 13 (employment income) |
| `domestic-staff` | Domestic staff | `Domestic Staff` | Nigeria Tax Act, 2025, section 14 (benefits connected with employment) |
| `company-vehicle` | Company vehicle benefit | `Company Vehicle`, `Vehicle Cost`, `Vehicle Details` | Nigeria Tax Act, 2025, section 14 (benefits-in-kind) |

Definitions should follow the project’s existing style, for example: `“A plain-language label for annual employment earnings before applicable deductions and reliefs are applied.”` The statutory reference field must carry the table context above; do not expose unsupported section numbers as if they were confirmed definitions.

- [ ] **Step 4: Run the focused tests and validate the JSON schema**

Run:

```powershell
npx vitest run src/lib/glossary.test.ts --no-file-parallelism
```

Expected: PASS, including the existing alias/boundary tests and the new terminology tests.

- [ ] **Step 5: Commit the taxonomy change**

```powershell
git add -- src/data/taxGlossary.json src/lib/glossary.test.ts
git commit -m "feat: expand tax glossary terminology"
```

### Task 2: Annotate the Tax Estimator and declaration field boundaries

**Files:**
- Modify: `src/pages/TaxCalculator.tsx`
- Modify: `src/pages/TaxCalculator.test.tsx`
- Modify: `src/components/declaration/EarnedIncomeStep.tsx`
- Modify: `src/components/declaration/InvestmentIncomeStep.tsx`
- Modify: `src/components/declaration/BenefitsStep.tsx`
- Modify: `src/components/declaration/DeductionsStep.tsx`
- Modify: `src/components/declaration/ReviewStep.tsx`
- Create: `src/components/declaration/GlossaryCoverage.test.tsx`

**Interfaces:**
- Consumes: the expanded glossary entries and existing `GlossaryText` component.
- Produces: tooltip triggers on labels, hints, section headings, calculated result labels, and review summary labels without changing form values or button behavior.

- [ ] **Step 1: Write failing integration tests for screenshot and declaration terms**

Extend `TaxCalculator.test.tsx` with assertions for the screenshot terms:

```ts
it("adds glossary triggers to calculator field terminology", () => {
  render(
    <TooltipProvider>
      <MemoryRouter>
        <TaxCalculator />
      </MemoryRouter>
    </TooltipProvider>,
  );

  expect(screen.getByRole("button", { name: "Learn about Annual salary" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Learn about Commissions and bonuses" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Learn about Allowances" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Learn about Business income" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Learn about Rent income" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Learn about Foreign income" })).toBeInTheDocument();
});
```

Create `GlossaryCoverage.test.tsx` that renders `EarnedIncomeStep` and asserts `Annual Salary`, `Allowances`, `Net Business Income`, `Pension Received`, and `Foreign Income` triggers after switching the existing tabs. Assert that the numeric input remains an input and has no nested glossary button.

- [ ] **Step 2: Run the focused integration tests and verify they fail**

Run:

```powershell
npx vitest run src/pages/TaxCalculator.test.tsx src/components/declaration/GlossaryCoverage.test.tsx --no-file-parallelism
```

Expected: FAIL because the field labels are currently plain strings.

- [ ] **Step 3: Wrap shared field labels and hints with `GlossaryText`**

For each local `Field`/`TextField`, use the existing wrapper at the text boundary:

```tsx
<Label className="text-xs font-semibold">
  <GlossaryText>{label}</GlossaryText>
</Label>
{hint && (
  <p className="text-[10px] text-muted-foreground">
    <GlossaryText>{hint}</GlossaryText>
  </p>
)}
```

Apply the same pattern to declaration section headings, explanatory paragraphs, `ReviewStep` summary labels, calculated result labels, and the Tax Estimator result block. Do not wrap the `<Input>`, `<Textarea>`, `<Button>`, `Select` controls, dynamic user-entered values, or file names.

- [ ] **Step 4: Run the focused integration tests and verify they pass**

Run the same Vitest command from Step 2. Expected: PASS, including the existing TaxCalculator glossary assertions and the new declaration coverage test.

- [ ] **Step 5: Commit the estimator/declaration integration**

```powershell
git add -- src/pages/TaxCalculator.tsx src/pages/TaxCalculator.test.tsx src/components/declaration/EarnedIncomeStep.tsx src/components/declaration/InvestmentIncomeStep.tsx src/components/declaration/BenefitsStep.tsx src/components/declaration/DeductionsStep.tsx src/components/declaration/ReviewStep.tsx src/components/declaration/GlossaryCoverage.test.tsx
git commit -m "feat: annotate calculator and declaration terminology"
```

### Task 3: Cover user-facing dashboard, submissions, profile, and filing copy

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/components/dashboard/StatCard.tsx`
- Modify: `src/components/submissions/SubmissionCard.tsx`
- Modify: `src/pages/Submissions.tsx`
- Modify: `src/pages/SubmissionDetail.tsx`
- Modify: `src/pages/Profile.tsx`
- Modify: `src/components/profile/ProfileHeader.tsx`
- Modify: `src/components/profile/ProfileForm.tsx`
- Modify: `src/components/profile/ProfileMenu.tsx`
- Modify: `src/components/declaration/DocumentsStep.tsx`
- Create: `src/pages/GlossaryCoverage.test.tsx`

**Interfaces:**
- Consumes: the same `GlossaryText` contract and expanded taxonomy from Tasks 1–2.
- Produces: consistent definitions for domain terminology in dashboard cards, submission status/details, filing summary copy, tax profile fields, retention notices, and document workflow text.

- [ ] **Step 1: Write failing page/component coverage tests**

Add a focused test that renders the reusable components/page content with representative data and verifies triggers for `Tax ID`, `Tax declaration`, `Tax Year`, `Tax authorities`, and `Tax records`. Assert that a user-supplied document filename is rendered as plain text without a glossary trigger.

- [ ] **Step 2: Run the focused page coverage test and verify it fails**

Run:

```powershell
npx vitest run src/pages/GlossaryCoverage.test.tsx --no-file-parallelism
```

Expected: FAIL because the targeted page/component copy is not yet wrapped.

- [ ] **Step 3: Apply `GlossaryText` only to static/domain copy**

Use the established pattern around headings, labels, hints, and explanatory paragraphs. Keep user data and controls outside the wrapper. For dynamic copy that contains both a static term and user data, split the static phrase from the dynamic value, for example:

```tsx
<p className="text-xs text-muted-foreground">
  <GlossaryText>Tax authorities requested additional documentation for</GlossaryText>{" "}
  {declaration.type} {declaration.taxYear}.
</p>
```

Do not annotate activity titles, message bodies, declaration names, or uploaded filenames because they are user/server content and may contain arbitrary text.

- [ ] **Step 4: Run the focused page coverage test and verify it passes**

Run the same Vitest command from Step 2. Expected: PASS with no nested glossary buttons inside controls and no annotation of user-entered data.

- [ ] **Step 5: Commit the page coverage**

```powershell
git add -- src/pages/Dashboard.tsx src/components/dashboard/StatCard.tsx src/components/submissions/SubmissionCard.tsx src/pages/Submissions.tsx src/pages/SubmissionDetail.tsx src/pages/Profile.tsx src/components/profile/ProfileHeader.tsx src/components/profile/ProfileForm.tsx src/components/profile/ProfileMenu.tsx src/components/declaration/DocumentsStep.tsx src/pages/GlossaryCoverage.test.tsx
git commit -m "feat: extend glossary coverage across app content"
```

### Task 4: Full verification and release review

**Files:**
- No new product files; review the files changed in Tasks 1–3.

**Interfaces:**
- Consumes: all committed glossary dataset, component, page, and test changes.
- Produces: a verified branch ready for review/deployment.

- [ ] **Step 1: Run the full Vitest suite**

Run:

```powershell
npx vitest run --no-file-parallelism --reporter=dot
```

Expected: all tests pass. Record any pre-existing warnings separately; do not hide failures.

- [ ] **Step 2: Run ESLint on all changed TypeScript files**

Run:

```powershell
npx eslint src/lib/glossary.ts src/lib/glossary.test.ts src/components/glossary src/components/declaration src/components/dashboard/StatCard.tsx src/components/submissions/SubmissionCard.tsx src/components/profile src/pages/Dashboard.tsx src/pages/TaxCalculator.tsx src/pages/TaxCalculator.test.tsx src/pages/Submissions.tsx src/pages/SubmissionDetail.tsx src/pages/Profile.tsx src/pages/GlossaryCoverage.test.tsx
```

Expected: exit code 0.

- [ ] **Step 3: Run the production build**

Run:

```powershell
npm run build
```

Expected: exit code 0. Existing Browserslist and bundle-size warnings may remain, but build errors fail the task.

- [ ] **Step 4: Review the final diff and worktree scope**

Run:

```powershell
git diff --check HEAD~3..HEAD
git status --short
git diff --stat HEAD~3..HEAD
```

Confirm the diff contains only the glossary spec/plan and Tasks 1–3, while unrelated `.gitignore`, `.gstack/`, `.npm-cache/`, and `handoff.md` changes remain uncommitted.

- [ ] **Step 5: Commit any required verification-only fixes and report results**

If verification exposes an implementation defect, add a failing regression test first, fix the defect, rerun the affected test and full suite, then stage the explicit feature paths and commit with:

```powershell
git add -- src/data/taxGlossary.json src/lib/glossary.ts src/lib/glossary.test.ts src/components/glossary src/components/declaration src/components/dashboard/StatCard.tsx src/components/submissions/SubmissionCard.tsx src/components/profile src/pages/Dashboard.tsx src/pages/TaxCalculator.tsx src/pages/TaxCalculator.test.tsx src/pages/Submissions.tsx src/pages/SubmissionDetail.tsx src/pages/Profile.tsx src/pages/GlossaryCoverage.test.tsx
git commit -m "fix: address glossary coverage verification findings"
```
