import { AlertTriangle, CheckCircle2, Clock, Download, FileCheck2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JurisdictionCapability } from "@/domain/jurisdictions";
import type { PreparationStatus } from "@/domain/tax-readiness";

export const PREPARATION_STATUS_LABELS: Record<PreparationStatus, string> = {
  draft: "Draft",
  ready_for_review: "Ready for review",
  exported: "Exported",
  user_submitted: "User submitted",
  authority_confirmed: "Authority confirmed",
};

const statusConfig: Record<PreparationStatus, { icon: typeof Clock; className: string }> = {
  draft: { icon: Clock, className: "bg-muted text-muted-foreground" },
  ready_for_review: { icon: FileCheck2, className: "bg-warning/10 text-warning" },
  exported: { icon: Download, className: "bg-info/10 text-info" },
  user_submitted: { icon: Send, className: "bg-primary/10 text-primary" },
  authority_confirmed: { icon: CheckCircle2, className: "bg-success/10 text-success" },
};

interface SubmissionStatusProps {
  readonly status: PreparationStatus;
  readonly capability?: JurisdictionCapability;
  readonly compact?: boolean;
  readonly className?: string;
}

export function SubmissionStatus({
  status,
  capability,
  compact = false,
  className,
}: SubmissionStatusProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const requiresManualHandoff = !capability ||
    capability.primaryReadiness === "Guided manual filing" ||
    capability.primaryReadiness === "Not yet supported" ||
    !capability.submissionModes.includes("adapter");

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full font-semibold",
          compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
          config.className,
        )}
        aria-label={`Status: ${PREPARATION_STATUS_LABELS[status]}`}
      >
        <StatusIcon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        {PREPARATION_STATUS_LABELS[status]}
      </div>

      {!compact && requiresManualHandoff && status !== "authority_confirmed" && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-semibold text-foreground">Authority handoff checklist</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {status === "user_submitted"
                  ? "Pending authority confirmation. You marked this preparation as submitted. FileSmart does not claim authority acceptance."
                  : "This preparation has not been submitted to a tax authority. FileSmart provides the package and guidance; you complete the authority handoff."}
              </p>
            </div>
          </div>
          <ul className="space-y-1.5 pl-6 text-xs text-muted-foreground list-disc">
            <li>Review the figures, assumptions, and confirmed documents.</li>
            <li>Download the universal PDF, CSV, or XLSX package.</li>
            <li>Submit through the applicable authority workflow and retain its reference.</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default SubmissionStatus;
