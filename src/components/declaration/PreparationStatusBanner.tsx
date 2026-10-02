import type { JurisdictionCapability } from "@/domain/jurisdictions";
import type { CalculationResult } from "@/lib/calculation-service";
import type { PreparationStatus } from "@/domain/tax-readiness";

interface PreparationStatusBannerProps {
  capability?: JurisdictionCapability;
  calculation: Pick<
    CalculationResult,
    | "label"
    | "filingReadiness"
    | "ruleProfile"
    | "ruleProfileVersion"
    | "source"
    | "missingInputWarnings"
  >;
  taxYear: string;
  status?: PreparationStatus;
  lastSavedAt?: string;
}

const formatSavedAt = (value?: string) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : undefined;

const PreparationStatusBanner = ({
  capability,
  calculation,
  taxYear,
  status,
  lastSavedAt,
}: PreparationStatusBannerProps) => {
  const readiness = capability?.primaryReadiness ?? "Not yet supported";
  const selectedJurisdiction = capability?.name ?? "No jurisdiction selected";
  const source = calculation.source || "Not configured";
  const ruleVersion = calculation.ruleProfileVersion || "Not configured";
  const savedAt = formatSavedAt(lastSavedAt);

  return (
    <section
      aria-label="Preparation status"
      aria-live="polite"
      className="mb-5 space-y-3 rounded-xl border border-border bg-card p-4 shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Local preparation
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">{selectedJurisdiction}</p>
        </div>
        <div className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
          {readiness}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Tax year</p>
          <p className="mt-0.5 font-semibold text-foreground">{taxYear || "Not selected"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Calculation</p>
          <p className="mt-0.5 font-semibold text-foreground">{calculation.label}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Rule version</p>
          <p className="mt-0.5 break-words font-semibold text-foreground">{ruleVersion}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Saved status</p>
          <p className="mt-0.5 font-semibold text-foreground">
            {status === "exported"
              ? "Exported — downloads ready"
              : status === "ready_for_review"
                ? "Ready for review"
                : status === "draft"
                  ? "Draft"
                  : "Not saved"}
          </p>
        </div>
      </div>

      <p className="break-words text-[10px] leading-relaxed text-muted-foreground">
        {readiness === "Not yet supported"
          ? "Authority workflow evidence is not validated for this jurisdiction. You can still prepare and save a generic Nigerian PIT package locally."
          : `Readiness reflects the registry capability only. ${readiness} does not confirm that a return has been filed.`}
      </p>
      <p className="break-words text-[10px] leading-relaxed text-muted-foreground">
        Rule source: {source}
      </p>

      {calculation.missingInputWarnings.length > 0 && (
        <div className="rounded-lg bg-warning/10 px-3 py-2 text-[10px] text-warning">
          <p className="font-semibold">Unresolved items</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {calculation.missingInputWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground" role="status">
        {savedAt ? `Last saved locally: ${savedAt}` : "Not saved locally yet."}
      </p>
    </section>
  );
};

export default PreparationStatusBanner;
