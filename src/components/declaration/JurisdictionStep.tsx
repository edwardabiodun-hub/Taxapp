import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JurisdictionCapability } from "@/domain/jurisdictions";
import EmptyState from "@/components/shared/EmptyState";

export interface JurisdictionStepProps {
  selectedCode: string;
  onSelect: (code: string) => void;
  capabilities: readonly JurisdictionCapability[];
}

function getEvidenceCopy(capability: JurisdictionCapability): string {
  const evidence =
    capability.evidence.template ??
    capability.evidence.integration ??
    (capability.ruleProfile.kind === "verified_state"
      ? capability.ruleProfile.evidence
      : undefined);

  if (!evidence) {
    return "Verification source not configured; generic preparation remains available.";
  }

  return `Source: ${evidence.source} · Verified ${evidence.verifiedAt}`;
}

const JurisdictionStep = ({
  selectedCode,
  onSelect,
  capabilities,
}: JurisdictionStepProps) => {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCapabilities = useMemo(
    () =>
      capabilities.filter((capability) =>
        [capability.name, capability.shortName, capability.jurisdictionCode]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [capabilities, normalizedQuery],
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display font-bold text-foreground text-sm">
          Select tax jurisdiction
        </h3>
        <p className="text-[11px] text-muted-foreground">
          Choose the Nigerian state or FCT connected to this preparation. Every jurisdiction
          supports generic local preparation; readiness describes the validated authority workflow.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="jurisdiction-search" className="text-xs font-semibold text-foreground">
          Search jurisdictions
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="jurisdiction-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by state or code"
            className="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-describedby="jurisdiction-search-help"
          />
        </div>
        <p id="jurisdiction-search-help" className="text-[10px] text-muted-foreground">
          {filteredCapabilities.length} of {capabilities.length} jurisdictions shown.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="Nigerian jurisdictions">
        {filteredCapabilities.map((capability) => {
          const selected = selectedCode === capability.jurisdictionCode;
          return (
            <button
              key={capability.jurisdictionCode}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(capability.jurisdictionCode)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(capability.jurisdictionCode);
                }
              }}
              className={cn(
                "relative flex min-w-0 items-start gap-3 rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected
                  ? "border-primary bg-primary/5 shadow-card"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 break-words text-sm font-semibold text-foreground">
                    {capability.name}
                  </p>
                  <span className="max-w-[40%] shrink-0 break-words rounded-full bg-muted px-1.5 py-0.5 text-right text-[9px] font-semibold text-muted-foreground">
                    {capability.shortName}
                  </span>
                </div>
                <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {capability.primaryReadiness}
                </span>
                <p className="mt-2 break-words text-[10px] leading-relaxed text-muted-foreground">
                  {getEvidenceCopy(capability)}
                </p>
              </div>
              {selected && (
                <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {filteredCapabilities.length === 0 && (
        <EmptyState title="No jurisdictions found" message="No Nigerian jurisdictions match that search." />
      )}
    </div>
  );
};

export default JurisdictionStep;
