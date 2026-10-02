# FileSmart Phase One National Nigerian Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend FileSmart from a Nigeria-only declaration prototype into an export-first preparation product covering all 36 Nigerian states and the FCT, with transparent capability labels, generic Nigerian PIT preparation, deadline countdowns, receipt OCR review, and universal PDF/CSV/XLSX outputs.

**Architecture:** Add a domain layer with one versioned jurisdiction-capability registry, one generic preparation model, and explicit adapter/status boundaries. Keep the first release local-first through Dexie, use conservative registry-driven claims, and make direct authority APIs optional feature-flagged adapters. Build the UI from the same domain services so state selection, calculations, deadlines, OCR, exports, and filing language cannot drift apart.

**Tech Stack:** Vite, React 18, TypeScript, React Router, Tailwind/shadcn-style components, Dexie, Vitest, React Testing Library, `jspdf`, and `xlsx` loaded through focused export modules.

**Spec:** `docs/superpowers/specs/2026-10-02-filesmart-phase-one-national-coverage-design.md`

## Global Constraints

- Cover Nigeria's 36 states and the Federal Capital Territory.
- Use exactly these readiness labels: `Direct filing`, `Portal-ready export`, `Guided manual filing`, `Not yet supported`.
- Use exactly these calculation labels: `State-specific estimate`, `Generic Nigerian PIT estimate`, `Not filing-ready`.
- Keep `Draft`, `Ready for review`, `Exported`, `User submitted`, and `Authority confirmed` distinct; never infer authority confirmation from export success or a generic HTTP success response.
- Do not make live state API access a launch dependency.
- Universal PDF, CSV, and XLSX output is available for every jurisdiction, but universal output is not represented as authority acceptance.
- OCR values are drafts and cannot enter a calculation until the user confirms them.
- State-specific rules, deadlines, templates, and integrations require a source, effective period, verification timestamp, and confidence.
- Store receipt originals privately and non-executably, use owner-scoped access, and do not put receipt content, tax IDs, or tokens in logs or URLs.
- The declaration's tax jurisdiction is separate from the profile country/theme setting.
- VAT-compliant invoicing, payment tracking, and accounts receivable remain outside this release.
- The implementation must preserve a manual receipt-entry path when OCR is unavailable.

## Review Focus

- **Stale or missing capability evidence:** A state with no verified rule/deadline/API source must fall back to the generic baseline and conservative readiness label; test this in the registry and deadline tasks.
- **Legacy false submission status:** Existing local declarations currently use `submitted`; migration must not turn a saved local draft into `Authority confirmed`; test this in persistence and status tasks.
- **Deadline boundary and timezone errors:** A deadline must be calculated from an absolute authority-timezone timestamp, show passed/remaining states correctly, and not poll the server; test this in the deadline task.
- **Unconfirmed OCR entering tax calculations:** Low-confidence or edited OCR remains excluded until explicit confirmation; test this in the receipt task and calculation integration.
- **Artifact and jurisdiction isolation:** Export packages and receipt assets must be accessible only to their owner and must preserve the selected jurisdiction/rule version in their metadata; test this in persistence/export security tasks.

## File and module map

The implementation should create focused modules instead of adding all behavior to `NewDeclaration.tsx` or `local-db.ts`.

| Responsibility | Files |
|---|---|
| Domain contracts and constants | `src/domain/tax-readiness.ts`, `src/domain/jurisdictions.ts`, `src/domain/preparations.ts`, `src/domain/deadlines.ts`, `src/domain/receipts.ts`, `src/domain/exports.ts`, `src/domain/submissions.ts` |
| Registry and rules | `src/data/jurisdiction-registry.ts`, `src/data/pit-baseline.ts`, `src/lib/jurisdiction-service.ts`, `src/lib/calculation-service.ts` |
| Persistence | `src/lib/local-db.ts`, `src/lib/preparation-repository.ts`, `src/lib/deadline-repository.ts`, `src/lib/receipt-repository.ts`, `src/lib/export-repository.ts` |
| Deadline behavior | `src/lib/deadline-service.ts`, `src/hooks/use-deadline-countdown.ts`, `src/components/deadlines/DeadlineCard.tsx` |
| OCR behavior | `src/lib/ocr/ocr-provider.ts`, `src/lib/ocr/managed-ocr-provider.ts`, `src/lib/ocr/ocr-service.ts`, `src/components/receipts/ReceiptScanner.tsx`, `src/components/receipts/OcrReview.tsx` |
| Exports | `src/lib/exports/csv-exporter.ts`, `src/lib/exports/xlsx-exporter.ts`, `src/lib/exports/pdf-exporter.ts`, `src/lib/exports/export-service.ts`, `src/components/exports/ExportPanel.tsx` |
| Declaration UX | `src/components/declaration/JurisdictionStep.tsx`, `src/components/declaration/PreparationStatusBanner.tsx`, `src/components/declaration/ReviewStep.tsx`, `src/pages/NewDeclaration.tsx` |
| Dashboard/navigation | `src/pages/Dashboard.tsx`, `src/components/layout/BottomNav.tsx`, `src/components/deadlines/DeadlineCard.tsx` |
| Feature flags/config | `src/lib/feature-flags.ts`, `src/lib/runtime-config.ts`, `.env.example` |
| Tests | `src/domain/__tests__/*`, `src/lib/__tests__/*`, `src/components/**/__tests__/*`, `src/test/fixtures/*` |

---

### Task 1: Establish domain contracts and the 37-jurisdiction registry

**Files:**
- Create: `src/domain/tax-readiness.ts`
- Create: `src/domain/jurisdictions.ts`
- Create: `src/domain/preparations.ts`
- Create: `src/domain/submissions.ts`
- Create: `src/data/jurisdiction-registry.ts`
- Create: `src/domain/__tests__/jurisdictions.test.ts`
- Create: `src/domain/__tests__/preparations.test.ts`
- Modify: `src/types/declaration.ts:1-92` to stop making country-only types the declaration contract while retaining a compatibility mapper for existing drafts

**Interfaces:**
- Produces `ReadinessLabel`, `CalculationLabel`, `PreparationStatus`, `JurisdictionCapability`, `PreparationRecord`, and `SubmissionEvent` for all later tasks.
- `getJurisdictionCapability(code: string): JurisdictionCapability` returns a conservative `Not yet supported` capability when a code is absent.
- `listNigeriaJurisdictions(): readonly JurisdictionCapability[]` returns exactly 37 unique entries.
- `getCalculationLabel(capability: JurisdictionCapability): CalculationLabel` returns `State-specific estimate` only when the rule profile is verified and otherwise returns `Generic Nigerian PIT estimate`.

- [ ] **Step 1: Write failing registry and type tests.**

```ts
import { describe, expect, it } from "vitest";
import {
  getJurisdictionCapability,
  listNigeriaJurisdictions,
} from "@/data/jurisdiction-registry";

describe("Nigeria jurisdiction registry", () => {
  it("contains all 36 states and the FCT exactly once", () => {
    const entries = listNigeriaJurisdictions();
    expect(entries).toHaveLength(37);
    expect(new Set(entries.map((entry) => entry.jurisdictionCode)).size).toBe(37);
    expect(entries.some((entry) => entry.jurisdictionCode === "NG-FCT")).toBe(true);
  });

  it("fails closed for an unknown jurisdiction", () => {
    const capability = getJurisdictionCapability("NG-UNKNOWN");
    expect(capability.primaryReadiness).toBe("Not yet supported");
    expect(capability.ruleProfile.kind).toBe("generic_nigerian_pit");
  });
});
```

- [ ] **Step 2: Run the focused tests and verify they fail because the domain modules do not exist.**

Run: `npm run test -- src/domain/__tests__/jurisdictions.test.ts src/domain/__tests__/preparations.test.ts`

Expected: FAIL with module or export errors.

- [ ] **Step 3: Add the shared literal unions and registry interfaces.**

```ts
export type ReadinessLabel =
  | "Direct filing"
  | "Portal-ready export"
  | "Guided manual filing"
  | "Not yet supported";

export type CalculationLabel =
  | "State-specific estimate"
  | "Generic Nigerian PIT estimate"
  | "Not filing-ready";

export type PreparationStatus =
  | "draft"
  | "ready_for_review"
  | "exported"
  | "user_submitted"
  | "authority_confirmed";

export type RuleProfile =
  | { kind: "verified_state"; profileId: string; version: string; source: string; verifiedAt: string }
  | { kind: "generic_nigerian_pit"; profileId: "ng-pit-baseline"; version: string; source: string; verifiedAt: string };

export interface JurisdictionCapability {
  jurisdictionCode: string;
  name: string;
  shortName: string;
  countryCode: "NG";
  ruleProfile: RuleProfile;
  primaryReadiness: ReadinessLabel;
  submissionModes: Array<"adapter" | "validated_export" | "guided_manual" | "generic_export">;
  apiStatus: "not_pursued" | "discovery" | "access_requested" | "sandbox" | "validated" | "production_ready";
  deadlineProfile: { kind: "verified_state" | "national_baseline" | "unverified"; source?: string; verifiedAt?: string; confidence: "high" | "medium" | "low" };
  exportFormats: Array<"pdf" | "csv" | "xlsx">;
  notes: string;
  registryVersion: string;
}
```

- [ ] **Step 4: Populate the registry with the 36 states and FCT.** Use stable codes `NG-AB`, `NG-AD`, `NG-AK`, `NG-AN`, `NG-BA`, `NG-BY`, `NG-BE`, `NG-BO`, `NG-CR`, `NG-DE`, `NG-EB`, `NG-ED`, `NG-EK`, `NG-EN`, `NG-GO`, `NG-IM`, `NG-JI`, `NG-KD`, `NG-KN`, `NG-KT`, `NG-KE`, `NG-KO`, `NG-KW`, `NG-LA`, `NG-NA`, `NG-NI`, `NG-OG`, `NG-ON`, `NG-OS`, `NG-OY`, `NG-PL`, `NG-RI`, `NG-SO`, `NG-TA`, `NG-YO`, `NG-ZA`, and `NG-FCT`. Set all initial launch capabilities to `Not yet supported` or `Guided manual filing` according to the existing validated analysis; do not invent direct filing or portal-ready claims.

- [ ] **Step 5: Add preparation and submission types.** The preparation must include `id`, `jurisdictionCode`, `taxYear`, `ruleProfileVersion`, `calculationLabel`, `filingReadiness`, `status`, `formData`, `confirmedReceiptIds`, `createdAt`, `updatedAt`, and `lastExportedAt`. A submission event must include an immutable event type, actor, timestamp, and optional authority reference.

- [ ] **Step 6: Run the focused tests and commit.**

Run: `npm run test -- src/domain/__tests__/jurisdictions.test.ts src/domain/__tests__/preparations.test.ts`

Expected: PASS.

Commit: `git add src/domain src/data src/types/declaration.ts && git commit -m "feat: add national jurisdiction capability model"`

### Task 2: Add the pinned Nigerian PIT baseline and calculation provenance

**Files:**
- Create: `src/data/pit-baseline.ts`
- Create: `src/lib/calculation-service.ts`
- Create: `src/lib/__tests__/calculation-service.test.ts`
- Modify: `src/lib/tax-calculator.ts` to delegate tax-result labeling and provenance to the new service without changing the existing calculator's numeric test fixtures until the approved baseline is mapped
- Modify: `src/domain/preparations.ts` to add calculation provenance fields

**Interfaces:**
- `calculatePreparation(input: PreparationCalculationInput, capability: JurisdictionCapability): CalculationResult` returns numeric result, `CalculationLabel`, rule profile version, source, assumptions, and missing-input warnings.
- `getPitBaseline(): PitBaseline` returns a pinned version and official source reference; it must throw a configuration error if the baseline has no source or effective tax-year metadata.

- [ ] **Step 1: Write tests for calculation labels and source provenance.**

```ts
it("labels an unverified state calculation as generic", () => {
  const result = calculatePreparation(minimumInput, notSupportedCapability);
  expect(result.label).toBe("Generic Nigerian PIT estimate");
  expect(result.ruleProfile.kind).toBe("generic_nigerian_pit");
});

it("does not claim state-specific rules without verified evidence", () => {
  const capability = { ...notSupportedCapability, ruleProfile: { kind: "generic_nigerian_pit", profileId: "ng-pit-baseline", version: "2026.1", source: "official-source", verifiedAt: "2026-10-02" } };
  expect(calculatePreparation(minimumInput, capability).label).not.toBe("State-specific estimate");
});
```

- [ ] **Step 2: Run the tests and verify they fail before the service exists.**

Run: `npm run test -- src/lib/__tests__/calculation-service.test.ts`

Expected: FAIL with missing module or function errors.

- [ ] **Step 3: Encode a versioned baseline object.** Store `profileId`, `version`, `effectiveTaxYears`, `source`, `verifiedAt`, and the existing calculator rule inputs in one object. The implementation must use the exact approved official source identified during execution; if that source is not configured, the service must produce `Not filing-ready` rather than fabricate a rule version.

- [ ] **Step 4: Implement `calculatePreparation`.** Delegate numeric computation to the existing calculator, attach the baseline or verified state profile, include assumptions and missing fields, and set `Not filing-ready` when required data is missing.

- [ ] **Step 5: Run focused and existing calculator tests.**

Run: `npm run test -- src/lib/__tests__/calculation-service.test.ts src/test/example.test.ts`

Expected: PASS with all pre-existing numeric behavior preserved.

- [ ] **Step 6: Commit.**

Commit: `git add src/data/pit-baseline.ts src/lib/calculation-service.ts src/lib/tax-calculator.ts src/domain/preparations.ts src/lib/__tests__/calculation-service.test.ts && git commit -m "feat: add tax calculation provenance"`

### Task 3: Migrate Dexie persistence to preparations, capabilities, and explicit statuses

**Files:**
- Modify: `src/lib/local-db.ts:1-74`
- Create: `src/lib/preparation-repository.ts`
- Create: `src/lib/deadline-repository.ts`
- Create: `src/lib/receipt-repository.ts`
- Create: `src/lib/export-repository.ts`
- Create: `src/lib/__tests__/local-db-migration.test.ts`
- Create: `src/lib/__tests__/preparation-repository.test.ts`
- Modify: `src/hooks/use-local-data.ts` and `src/lib/sync-service.ts` to use preparation status semantics

**Interfaces:**
- `savePreparation(preparation: PreparationRecord): Promise<void>` creates or updates owner-local data while preserving `updatedAt`.
- `getPreparation(id: string): Promise<PreparationRecord | undefined>` returns only the requested local record.
- `listPreparations(): Promise<PreparationRecord[]>` returns records ordered by `updatedAt` descending.
- `appendSubmissionEvent(event: SubmissionEvent): Promise<void>` writes immutable status history.
- `migrateLegacyDeclaration(record: LocalDeclaration): PreparationRecord` maps `country: "ng"` to Nigeria context and maps legacy `submitted` to `ready_for_review` unless an authority confirmation reference exists.

- [ ] **Step 1: Write migration tests for existing local records.**

```ts
it("does not treat the legacy submitted flag as authority confirmation", () => {
  const migrated = migrateLegacyDeclaration({
    id: "decl-1", taxYear: "2025", country: "ng", type: "Income Tax",
    status: "submitted", formData: {}, documents: [], createdAt: "2026-01-01",
    updatedAt: "2026-01-01", pendingSync: false,
  });
  expect(migrated.status).toBe("ready_for_review");
  expect(migrated.status).not.toBe("authority_confirmed");
});
```

- [ ] **Step 2: Run migration tests and verify the new repository/migration exports are missing.**

Run: `npm run test -- src/lib/__tests__/local-db-migration.test.ts src/lib/__tests__/preparation-repository.test.ts`

Expected: FAIL with missing exports.

- [ ] **Step 3: Add Dexie stores and bump the schema version.** Add stores for `preparations`, `jurisdictionCapabilities`, `deadlines`, `receiptRecords`, `exportPackages`, and `submissionEvents`. Keep the legacy `declarations` store for one migration cycle. Do not store raw receipt bytes in indexed fields; store an asset reference and metadata.

- [ ] **Step 4: Implement repositories with deterministic migration and status validation.** The repositories must reject invalid status transitions such as `draft` directly to `authority_confirmed`, and must preserve rule/capability versions on saved records.

- [ ] **Step 5: Update sync hooks to treat `pendingSync` as preparation synchronization, not submission confirmation.** A failed sync must leave the preparation usable locally and must not change its authority status.

- [ ] **Step 6: Run migration/repository tests and commit.**

Run: `npm run test -- src/lib/__tests__/local-db-migration.test.ts src/lib/__tests__/preparation-repository.test.ts`

Expected: PASS.

Commit: `git add src/lib/local-db.ts src/lib/preparation-repository.ts src/lib/deadline-repository.ts src/lib/receipt-repository.ts src/lib/export-repository.ts src/hooks/use-local-data.ts src/lib/sync-service.ts src/lib/__tests__ && git commit -m "feat: persist preparation lifecycle"`

### Task 4: Replace country-only declaration selection with national jurisdiction selection

**Files:**
- Create: `src/components/declaration/JurisdictionStep.tsx`
- Create: `src/components/declaration/PreparationStatusBanner.tsx`
- Modify: `src/pages/NewDeclaration.tsx:1-115`
- Modify: `src/components/declaration/StepIndicator.tsx`
- Modify: `src/lib/validation.ts`
- Create: `src/components/declaration/__tests__/JurisdictionStep.test.tsx`
- Create: `src/pages/__tests__/NewDeclaration.test.tsx`
- Retire usage of: `src/components/declaration/CountryStep.tsx` in the declaration flow; preserve the file only if it remains required by non-declaration profile UX

**Interfaces:**
- `JurisdictionStep` consumes `selectedCode`, `onSelect(code)`, and `capabilities`.
- `NewDeclaration` consumes `PreparationRecord`, `savePreparation`, and `calculatePreparation`; it must initialize `jurisdictionCode` to `NG-FCT` only when the user explicitly selects it, not by silently converting all records.

- [ ] **Step 1: Write component tests for all-state selection and readiness labels.**

```tsx
it("renders all 37 jurisdictions and allows a guided/manual state to be selected", async () => {
  render(<JurisdictionStep selectedCode="" onSelect={vi.fn()} capabilities={listNigeriaJurisdictions()} />);
  expect(screen.getByRole("button", { name: /Lagos/i })).toBeEnabled();
  expect(screen.getByText("Guided manual filing")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the component tests and verify they fail against the current country selector.**

Run: `npm run test -- src/components/declaration/__tests__/JurisdictionStep.test.tsx src/pages/__tests__/NewDeclaration.test.tsx`

Expected: FAIL because the current selector renders eight countries and disables non-Nigeria choices.

- [ ] **Step 3: Implement the searchable 37-jurisdiction selector.** Use registry entries, not `africanCountries`, and show readiness badges plus source/verification copy. All entries are selectable for generic preparation. Keep profile country/theme logic out of this component.

- [ ] **Step 4: Refactor `NewDeclaration` to save a preparation as `draft` or `ready_for_review`.** Remove the unconditional `status: "submitted"` write. Add explicit save behavior, last-saved UI, calculation label, and capability banner. Keep the existing step data fields as the first generic PIT schema.

- [ ] **Step 5: Update step validation and review copy.** Validation errors must identify missing data without saying the declaration has been filed. Review must show selected jurisdiction, readiness, calculation label, rule source/version, and unresolved items.

- [ ] **Step 6: Run focused UI tests and commit.**

Run: `npm run test -- src/components/declaration/__tests__/JurisdictionStep.test.tsx src/pages/__tests__/NewDeclaration.test.tsx`

Expected: PASS.

Commit: `git add src/components/declaration src/pages/NewDeclaration.tsx src/pages/__tests__ src/lib/validation.ts && git commit -m "feat: add national declaration jurisdiction flow"`

### Task 5: Implement deadline resolution and countdown behavior

**Files:**
- Modify: `src/domain/deadlines.ts`
- Create: `src/lib/deadline-service.ts`
- Create: `src/hooks/use-deadline-countdown.ts`
- Create: `src/components/deadlines/DeadlineCard.tsx`
- Create: `src/lib/__tests__/deadline-service.test.ts`
- Create: `src/components/deadlines/__tests__/DeadlineCard.test.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/NewDeclaration.tsx`

**Interfaces:**
- `resolveDeadline(capability, taxYear, now): ResolvedDeadline` uses state-specific verified deadline first, national baseline second, and an unverified state otherwise.
- `useDeadlineCountdown(deadline: ResolvedDeadline | null, now?: () => Date): CountdownState` returns days, hours, `isPassed`, `isStale`, and source label while cleaning up its boundary timer.

- [ ] **Step 1: Write tests for precedence, fallback, timezone, passed, and stale states.**

```ts
it("prefers a verified state deadline over the national baseline", () => {
  const resolved = resolveDeadline(capabilityWithStateDeadline, "2026", fixedNow);
  expect(resolved.sourceKind).toBe("verified_state");
  expect(resolved.label).toContain("State deadline");
});

it("uses a national baseline with an explicit caveat when state data is unavailable", () => {
  const resolved = resolveDeadline(capabilityWithoutStateDeadline, "2026", fixedNow);
  expect(resolved.sourceKind).toBe("national_baseline");
  expect(resolved.label).toContain("confirm with your tax authority");
});
```

- [ ] **Step 2: Run focused deadline tests and verify they fail.**

Run: `npm run test -- src/lib/__tests__/deadline-service.test.ts src/components/deadlines/__tests__/DeadlineCard.test.tsx`

Expected: FAIL with missing service/component exports.

- [ ] **Step 3: Implement the deadline domain model and resolver.** Require ISO timestamps with an explicit timezone, source, `verifiedAt`, tax year, and confidence. Reject malformed or expired source metadata rather than displaying a false verified state deadline.

- [ ] **Step 4: Implement the countdown hook with boundary updates only.** Calculate against an absolute deadline timestamp, update at minute/day boundaries, clean up the timer on unmount, and never refetch the server periodically.

- [ ] **Step 5: Render the dashboard and preparation deadline cards.** Include countdown, passed state, source class, verification date, confidence, offline/stale indicators, and an unverified state. Do not announce every second through `aria-live`.

- [ ] **Step 6: Run tests and commit.**

Run: `npm run test -- src/lib/__tests__/deadline-service.test.ts src/components/deadlines/__tests__/DeadlineCard.test.tsx`

Expected: PASS.

Commit: `git add src/domain/deadlines.ts src/lib/deadline-service.ts src/hooks/use-deadline-countdown.ts src/components/deadlines src/pages/Dashboard.tsx src/pages/NewDeclaration.tsx && git commit -m "feat: add source-aware tax deadline tracker"`

### Task 6: Add receipt capture, managed OCR boundary, and confirmation workflow

**Files:**
- Create: `src/domain/receipts.ts`
- Create: `src/lib/ocr/ocr-provider.ts`
- Create: `src/lib/ocr/managed-ocr-provider.ts`
- Create: `src/lib/ocr/ocr-service.ts`
- Create: `src/components/receipts/ReceiptScanner.tsx`
- Create: `src/components/receipts/OcrReview.tsx`
- Create: `src/components/receipts/__tests__/ReceiptScanner.test.tsx`
- Create: `src/lib/__tests__/ocr-service.test.ts`
- Modify: `src/components/declaration/DocumentsStep.tsx`
- Modify: `.env.example`

**Interfaces:**
- `OcrProvider.extract(asset: ReceiptAsset): Promise<OcrExtraction>` returns fields plus per-field confidence and provider metadata.
- `confirmReceipt(id, corrections): Promise<ReceiptRecord>` is the only operation that makes receipt values eligible for calculations.
- `getCalculationReceiptInputs(records): ConfirmedReceiptInput[]` filters out captured, processing, needs-review, and rejected records.

- [ ] **Step 1: Write tests proving unconfirmed OCR cannot enter calculations.**

```ts
it("excludes OCR fields until the user confirms the record", () => {
  const records = [needsReviewReceipt, confirmedReceipt];
  expect(getCalculationReceiptInputs(records)).toEqual([confirmedReceipt.calculationInput]);
});

it("preserves corrected values and marks them as user-confirmed", async () => {
  const record = await confirmReceipt("receipt-1", { amount: "12500", category: "transport" });
  expect(record.reviewStatus).toBe("confirmed");
  expect(record.fields.amount.value).toBe("12500");
});
```

- [ ] **Step 2: Run OCR tests and verify they fail before the boundary exists.**

Run: `npm run test -- src/lib/__tests__/ocr-service.test.ts src/components/receipts/__tests__/ReceiptScanner.test.tsx`

Expected: FAIL with missing provider/service exports.

- [ ] **Step 3: Implement the provider interface and managed provider configuration.** Use runtime-configured endpoint/key names without logging secrets. The managed provider must validate response shape and attach provider/model/version metadata. If configuration is absent or the provider is unavailable, return a manual-entry state rather than failing the declaration.

- [ ] **Step 4: Implement client-side file checks before upload.** Accept only configured image MIME types, reject executable/script extensions, enforce the documented size limit, and preserve the original asset reference. Keep the storage/provider call behind `OcrProvider` so the eventual private backend can replace the client path without changing the UI contract.

- [ ] **Step 5: Implement scanner and review UI.** Show consent before provider processing, confidence indicators, editable fields for vendor/date/amount/tax amount/currency/category, original image preview, confirm/reject actions, and an explicit no-training/retention notice only when the configured vendor contract supports that claim.

- [ ] **Step 6: Attach only confirmed receipt IDs to a preparation and run tests.**

Run: `npm run test -- src/lib/__tests__/ocr-service.test.ts src/components/receipts/__tests__/ReceiptScanner.test.tsx src/lib/__tests__/calculation-service.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit.**

Commit: `git add src/domain/receipts.ts src/lib/ocr src/components/receipts src/components/declaration/DocumentsStep.tsx src/lib/__tests__ .env.example && git commit -m "feat: add reviewable receipt OCR workflow"`

### Task 7: Build universal PDF, CSV, and XLSX export packages

**Files:**
- Create: `src/domain/exports.ts`
- Create: `src/lib/exports/csv-exporter.ts`
- Create: `src/lib/exports/xlsx-exporter.ts`
- Create: `src/lib/exports/pdf-exporter.ts`
- Create: `src/lib/exports/export-service.ts`
- Create: `src/components/exports/ExportPanel.tsx`
- Create: `src/lib/__tests__/export-service.test.ts`
- Create: `src/components/exports/__tests__/ExportPanel.test.tsx`
- Modify: `package.json` and `package-lock.json` to add pinned `jspdf` and `xlsx` versions after checking current compatibility with Vite/TypeScript

**Interfaces:**
- `generateExportPackage(preparation, receipts, capability): Promise<ExportPackage>` returns PDF/CSV/XLSX artifacts, schema version, metadata, and `status: "exported"`.
- `ExportMetadata` includes preparation ID, jurisdiction, tax year, rule profile/version, calculation label, readiness, generatedAt, and `notSubmitted: true`.
- `ExportPanel` consumes an `ExportPackage` and renders download actions without changing submission status to authority-confirmed.

- [ ] **Step 1: Write tests for stable metadata and all three formats.**

```ts
it("generates all universal formats for an unsupported jurisdiction", async () => {
  const result = await generateExportPackage(preparation, [], notSupportedCapability);
  expect(result.artifacts.map((artifact) => artifact.format)).toEqual(["pdf", "csv", "xlsx"]);
  expect(result.metadata.notSubmitted).toBe(true);
  expect(result.metadata.calculationLabel).toBe("Generic Nigerian PIT estimate");
});
```

- [ ] **Step 2: Run export tests and verify they fail before dependencies/exporters exist.**

Run: `npm run test -- src/lib/__tests__/export-service.test.ts src/components/exports/__tests__/ExportPanel.test.tsx`

Expected: FAIL with missing exporter/service exports.

- [ ] **Step 3: Add the pinned export dependencies with focused imports.** Avoid importing export libraries into the initial application bundle until the export action is used; keep `xlsx` and `jspdf` behind dynamic imports where the Vite build permits it.

- [ ] **Step 4: Implement CSV with a documented schema version.** Escape commas, quotes, newlines, and formula-like values; include summary, income/deductions, assumptions, and document-index sections with stable headers.

- [ ] **Step 5: Implement XLSX with summary, detail, assumptions, and document-index sheets.** Include the same metadata and a visible `Not submitted` notice. Keep receipt images out of workbook cells; include safe references and user-facing names only.

- [ ] **Step 6: Implement PDF summary and filing checklist.** Include selected authority/jurisdiction, tax year, calculation label, readiness label, source dates, missing items, documents, and clear export-not-submission language.

- [ ] **Step 7: Persist export metadata and render the download panel.** A successful generation moves the preparation to `exported`; it does not create a `user_submitted` or `authority_confirmed` event.

- [ ] **Step 8: Run tests/build and commit.**

Run: `npm run test -- src/lib/__tests__/export-service.test.ts src/components/exports/__tests__/ExportPanel.test.tsx`; `npm run build`

Expected: PASS and a production build with no TypeScript errors.

Commit: `git add package.json package-lock.json src/domain/exports.ts src/lib/exports src/components/exports src/lib/__tests__ && git commit -m "feat: add universal tax export packages"`

### Task 8: Add explicit filing status and adapter boundaries

**Files:**
- Create: `src/lib/submission-adapters/submission-adapter.ts`
- Create: `src/lib/submission-adapters/universal-export-adapter.ts`
- Create: `src/lib/submission-service.ts`
- Create: `src/lib/__tests__/submission-service.test.ts`
- Create: `src/components/submissions/SubmissionStatus.tsx`
- Modify: `src/pages/SubmissionDetail.tsx`
- Modify: `src/pages/Submissions.tsx`
- Modify: `src/components/submissions/SubmissionCard.tsx`

**Interfaces:**
- `SubmissionAdapter.prepare(preparation, capability): Promise<SubmissionPackage>`
- `SubmissionAdapter.submit(package, context): Promise<UserSubmissionResult>`
- `SubmissionAdapter.getStatus(reference): Promise<AuthorityStatus>`
- `SubmissionService.export(preparationId): Promise<ExportPackage>`
- `SubmissionService.markUserSubmitted(preparationId, evidence): Promise<void>`
- `SubmissionService.confirmAuthority(preparationId, authorityReference): Promise<void>`; reject calls without a reference.

- [ ] **Step 1: Write transition tests.**

```ts
it("allows export without authority confirmation", async () => {
  const result = await submissionService.export("prep-1");
  expect(result.metadata.notSubmitted).toBe(true);
  expect(await repository.get("prep-1")).toMatchObject({ status: "exported" });
});

it("rejects authority confirmation without an official reference", async () => {
  await expect(submissionService.confirmAuthority("prep-1", "")).rejects.toThrow(/reference/i);
});
```

- [ ] **Step 2: Run tests and verify they fail before the service exists.**

Run: `npm run test -- src/lib/__tests__/submission-service.test.ts`

Expected: FAIL with missing adapter/service exports.

- [ ] **Step 3: Implement the universal export adapter and transition validator.** The adapter supports preparation/export only. Direct state adapters are not registered in this release unless a capability entry is explicitly marked `production_ready`.

- [ ] **Step 4: Implement status UI with accurate language.** Display `Draft`, `Ready for review`, `Exported`, `User submitted`, and `Authority confirmed` distinctly. For generic/manual jurisdictions, display the authority handoff checklist rather than a fake submit action.

- [ ] **Step 5: Run focused status tests and commit.**

Run: `npm run test -- src/lib/__tests__/submission-service.test.ts`; `npm run build`

Expected: PASS.

Commit: `git add src/lib/submission-adapters src/lib/submission-service.ts src/lib/__tests__/submission-service.test.ts src/components/submissions src/pages/Submissions.tsx src/pages/SubmissionDetail.tsx && git commit -m "feat: separate export and authority filing status"`

### Task 9: Add feature flags, runtime configuration, and registry caching

**Files:**
- Create: `src/lib/feature-flags.ts`
- Create: `src/lib/runtime-config.ts`
- Create: `src/lib/jurisdiction-service.ts`
- Create: `src/lib/__tests__/feature-flags.test.ts`
- Modify: `.env.example`
- Modify: `src/App.tsx` to load cached capability data without blocking generic preparation

**Interfaces:**
- `featureFlags` exposes `nationalJurisdictions`, `genericPreparation`, `universalExports`, `deadlineTracker`, `receiptOcr`, and `submissionAdapters` as independently evaluated booleans.
- `loadJurisdictionCapabilities(): Promise<JurisdictionCapability[]>` returns cached or bundled registry data and never disables the generic workflow when a refresh fails.

- [ ] **Step 1: Write tests for flag isolation and offline registry behavior.**

```ts
it("keeps generic preparation and exports available when OCR is disabled", () => {
  const flags = resolveFeatureFlags({ FILESMART_ENABLE_OCR: "false" });
  expect(flags.genericPreparation).toBe(true);
  expect(flags.universalExports).toBe(true);
  expect(flags.receiptOcr).toBe(false);
});

it("uses bundled conservative registry data when refresh fails", async () => {
  await expect(loadJurisdictionCapabilities({ refresh: failingRefresh })).resolves.toHaveLength(37);
});
```

- [ ] **Step 2: Run tests and verify they fail.**

Run: `npm run test -- src/lib/__tests__/feature-flags.test.ts`

Expected: FAIL with missing modules.

- [ ] **Step 3: Implement runtime config with public values only.** Never expose OCR provider secrets, LLM keys, database service keys, or private storage credentials through Vite client variables. The client receives only feature flags and public endpoints/configuration.

- [ ] **Step 4: Implement registry caching and failure behavior.** Cache versioned registry entries in Dexie, show stale metadata in the UI, and preserve bundled conservative entries when refresh fails.

- [ ] **Step 5: Run tests/build and commit.**

Run: `npm run test -- src/lib/__tests__/feature-flags.test.ts`; `npm run build`

Expected: PASS.

Commit: `git add src/lib/feature-flags.ts src/lib/runtime-config.ts src/lib/jurisdiction-service.ts src/lib/__tests__/feature-flags.test.ts src/App.tsx .env.example && git commit -m "feat: add phase one feature controls"`

### Task 10: Complete accessibility, responsive states, and empty/error handling

**Files:**
- Modify: `src/components/declaration/JurisdictionStep.tsx`
- Modify: `src/components/deadlines/DeadlineCard.tsx`
- Modify: `src/components/receipts/ReceiptScanner.tsx`
- Modify: `src/components/receipts/OcrReview.tsx`
- Modify: `src/components/exports/ExportPanel.tsx`
- Modify: `src/pages/NotFound.tsx`
- Create: `src/components/shared/LoadingState.tsx`
- Create: `src/components/shared/EmptyState.tsx`
- Create: `src/components/shared/ErrorState.tsx`
- Create: `src/components/shared/__tests__/state-components.test.tsx`

**Interfaces:**
- Shared state components accept a message, optional action, and safe error identifier; they must never render stack traces or raw provider responses.

- [ ] **Step 1: Write tests for keyboard operation and safe states.**

```tsx
it("allows keyboard selection of a jurisdiction", async () => {
  render(<JurisdictionStep selectedCode="" onSelect={onSelect} capabilities={listNigeriaJurisdictions()} />);
  const search = screen.getByRole("searchbox", { name: /jurisdiction/i });
  await userEvent.type(search, "Ogun");
  await userEvent.tab();
  await userEvent.keyboard("{Enter}");
  expect(onSelect).toHaveBeenCalledWith("NG-OG");
});

it("renders a human-readable OCR error without provider details", () => {
  render(<ErrorState title="Receipt scanning unavailable" errorCode="OCR_UNAVAILABLE" />);
  expect(screen.getByText(/try manual entry/i)).toBeInTheDocument();
  expect(screen.queryByText(/stack|api key|provider/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests and verify any new components fail before implementation.**

Run: `npm run test -- src/components/shared/__tests__/state-components.test.tsx`

Expected: FAIL with missing exports or inaccessible controls.

- [ ] **Step 3: Add loading, empty, error, offline, and stale states to the new flows.** Include retry/manual-entry actions and preserve user data on failure.

- [ ] **Step 4: Add labels, focus states, keyboard behavior, non-color readiness indicators, and responsive layouts.** Ensure the countdown uses bounded `aria-live` announcements and long state/vendor/amount values do not overflow.

- [ ] **Step 5: Run the full test suite and build.**

Run: `npm run test`; `npm run lint`; `npm run build`

Expected: PASS with no new lint errors or TypeScript build errors.

- [ ] **Step 6: Commit.**

Commit: `git add src/components src/pages/NotFound.tsx && git commit -m "feat: harden phase one UX states and accessibility"`

### Task 11: Integrate dashboard, navigation, and release documentation

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/components/layout/BottomNav.tsx`
- Modify: `src/pages/Submissions.tsx`
- Modify: `README.md`
- Create: `docs/filesmart-phase-one-operations.md`
- Create: `src/test/fixtures/jurisdictions.ts`
- Create: `src/test/fixtures/preparations.ts`

**Interfaces:**
- Dashboard consumes `DeadlineCard`, preparation counts, and capability summaries from domain services.
- Operations documentation defines registry review, deadline-source review, OCR provider configuration, export schema versioning, and adapter approval evidence.

- [ ] **Step 1: Write integration tests for the primary user path.** Cover: select Ogun (or another non-Nigeria-only state), complete partial generic preparation, save, reload, see generic label and deadline caveat, confirm one receipt, generate PDF/CSV/XLSX, and see `Exported` rather than `Submitted`.

- [ ] **Step 2: Run the integration tests before wiring dashboard/navigation.**

Run: `npm run test -- src/pages/__tests__/NewDeclaration.test.tsx`

Expected: FAIL for missing integrated behavior.

- [ ] **Step 3: Add deadline tracker and preparation summary to the dashboard.** Keep the free tools discoverable without presenting the deadline as professional advice or a filing confirmation.

- [ ] **Step 4: Update navigation and submission history.** Show saved preparations and export packages with jurisdiction, tax year, calculation label, readiness, and status. Do not hide generic/manual preparations from history.

- [ ] **Step 5: Document operating controls.** Include the registry source-review process, source freshness expectations, baseline rule approval, OCR consent/retention/security requirements, export schemas, feature flags, and the evidence required to promote a capability to portal-ready or direct filing.

- [ ] **Step 6: Run full verification and commit.**

Run: `npm run test`; `npm run lint`; `npm run build`

Expected: PASS.

Commit: `git add src/pages/Dashboard.tsx src/components/layout/BottomNav.tsx src/pages/Submissions.tsx README.md docs/filesmart-phase-one-operations.md src/test/fixtures && git commit -m "feat: complete phase one preparation experience"`

### Task 12: Security review, migration rehearsal, and release gate

**Files:**
- Create: `src/lib/__tests__/security-boundaries.test.ts`
- Create: `docs/superpowers/reviews/2026-10-02-filesmart-phase-one-release-checklist.md`
- Modify: `docs/filesmart-phase-one-operations.md`
- Modify: `.gitignore` only if local OCR/export artifacts require exclusion

**Interfaces:**
- The release checklist records commands, expected results, evidence, and rollback steps; it does not authorize production deployment by itself.

- [ ] **Step 1: Write security-boundary tests.** Verify executable extension rejection, MIME/size rejection, no unconfirmed receipt inclusion, no cross-owner repository access, no raw error leakage, and no authority confirmation without a reference.

- [ ] **Step 2: Run the security tests and inspect failures.**

Run: `npm run test -- src/lib/__tests__/security-boundaries.test.ts`

Expected: PASS only after every boundary is enforced; any failure blocks release.

- [ ] **Step 3: Rehearse the Dexie migration with a copy of representative legacy records.** Verify existing Nigeria drafts, legacy submitted records, missing documents, and pending sync states remain readable and are not presented as authority-confirmed.

- [ ] **Step 4: Run the final static checks and inspect the production bundle.**

Run: `npm run test`; `npm run lint`; `npm run build`; `git diff main...HEAD --stat`

Expected: all checks pass, no secrets or generated user artifacts are committed, and dynamic export/OCR code is not loaded on the initial route unless required.

- [ ] **Step 5: Write the release checklist with rollback instructions.** Rollback must disable new feature flags and preserve existing local data; it must not delete user preparations or receipt records.

- [ ] **Step 6: Commit the release evidence.**

Commit: `git add src/lib/__tests__/security-boundaries.test.ts docs/superpowers/reviews/2026-10-02-filesmart-phase-one-release-checklist.md docs/filesmart-phase-one-operations.md .gitignore && git commit -m "chore: add phase one security release gate"`

## Self-review checklist

- [x] Spec coverage mapped: registry, generic workflow, persistence, deadlines, OCR, exports, submission semantics, UX, security, rollout, testing, and operations each have an owning task.
- [x] Placeholder scan completed: every implementation step names its files, behavior, test, and acceptance result.
- [x] Type consistency checked: registry capability, preparation, calculation result, OCR record, export package, and submission event names remain consistent across tasks.
- [x] Review-focus cases are pinned to tests in Tasks 1, 3, 5, 6, 7, 8, and 12.
- [x] VAT invoicing/payment tracking is excluded from implementation tasks as approved.
- [x] Direct state API integrations are optional and fail closed behind the registry and feature flags.
- [x] The current local-first architecture is respected; no undocumented backend dependency is introduced.
