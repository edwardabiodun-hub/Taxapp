# App-Wide Tax Terminology Glossary Design

## Goal

Make recognized Nigerian tax and financial terminology across the user-facing app discoverable through an accessible hover/focus definition tooltip, including the Tax Estimator labels shown in the supplied screenshot.

## Context

The repository already has a validated glossary dataset, a boundary-aware tokenizer, and an accessible `GlossaryTooltip` component. `GlossaryText` is currently applied only to two explanatory paragraphs in `TaxCalculator`, so labels such as “Annual Salary,” “Allowances,” and “Business Income (Net)” are not interactive.

## Scope

### In scope

- Tax and financial terminology visible in the Tax Estimator, declaration workflow, review/results screens, profile tax fields, submissions, and other user-facing tax explanations.
- The terminology dataset, including concise plain-English definitions and statutory references based on the current Nigerian tax-law sources already used by the project.
- Consistent hover, keyboard-focus, click/tap, Escape dismissal, and responsive tooltip behavior.
- Tests proving screenshot terms and representative declaration/results terms become glossary triggers.

### Out of scope

- Generic product/navigation words such as “Home,” “Save,” or “Cancel.”
- User-entered values, input placeholders, links, buttons, code, and other interactive controls where automatic wrapping could interfere with the control’s primary action.
- A raw DOM scanner. The implementation will use React content boundaries so behavior remains testable and does not mutate uncontrolled DOM or user input.
- Changes to tax-calculation rules or legal advice beyond glossary copy and citations.

## User experience and accessibility

- Recognized terms use a subtle dotted underline and inherit the surrounding text styling.
- Hover and keyboard focus open the definition after the existing 150 ms delay.
- The trigger is a semantic button with `type="button"`, a descriptive `aria-label`, visible focus styling, and Radix-managed tooltip semantics.
- Clicking/tapping toggles the tooltip; Escape closes it.
- The tooltip includes the concise definition and statutory reference and is constrained to the viewport.
- A `data-glossary-ignore` escape hatch remains available for content that should not be annotated.

## Architecture

1. Keep `src/lib/glossary.ts` as the validated data/tokenization boundary.
2. Expand `src/data/taxGlossary.json` with the user-facing tax/financial terms found during the app inventory, including the screenshot labels.
3. Keep `GlossaryTooltip` as the single interactive presentation component.
4. Apply `GlossaryText` at controlled React boundaries:
   - shared field labels and hints;
   - section headings and result labels;
   - page-level explanatory copy and review/submission summaries.
5. Preserve exclusions for form controls, links, code, and user-entered content.

This deliberately avoids wrapping the entire app through a DOM `TreeWalker`: that approach would make React ownership, event lifecycle, keyboard semantics, and test isolation less reliable, especially around inputs and navigation.

## Data rules

- Each added entry must satisfy the existing Zod schema.
- Definitions remain concise and suitable for a tooltip.
- Statutory references must use the current Nigerian tax-law source convention already established in the dataset; legacy-law references are not introduced as if they were the current consolidated framework.
- Terms with overlapping phrases must be tokenized longest-first and respect word boundaries.

## Verification

- Unit tests cover tokenization, aliases, longest-match behavior, and boundaries.
- Component tests cover hover/focus tooltip rendering and Escape dismissal.
- Integration tests cover the Tax Estimator screenshot labels and at least one declaration/review flow.
- Run the complete Vitest suite, feature ESLint, and production build before release.

