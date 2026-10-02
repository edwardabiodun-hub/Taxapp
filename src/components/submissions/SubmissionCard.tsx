import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import type { PreparationStatus } from "@/domain/tax-readiness";
import type { JurisdictionCapability } from "@/domain/jurisdictions";
import SubmissionStatus, { PREPARATION_STATUS_LABELS } from "@/components/submissions/SubmissionStatus";

export interface SubmissionItem {
  id: string;
  taxYear: string;
  type: string;
  status: PreparationStatus | "submitted" | "processing" | "audit_request" | "approved";
  date: string;
  amount: string;
  capability?: JurisdictionCapability;
}

interface SubmissionCardProps {
  submission: SubmissionItem;
  onClick?: () => void;
}

const SubmissionCard = ({ submission, onClick }: SubmissionCardProps) => {
  const isPreparationStatus = [
    "draft",
    "ready_for_review",
    "exported",
    "user_submitted",
    "authority_confirmed",
  ].includes(submission.status);
  const status = isPreparationStatus
    ? submission.status as PreparationStatus
    : "ready_for_review" as const;
  const legacy = !isPreparationStatus;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 bg-card rounded-xl shadow-card hover:shadow-elevated transition-all text-left"
    >
      <div className="p-2 rounded-lg bg-muted text-muted-foreground">
        <SubmissionStatus status={status} compact />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-card-foreground truncate">
          {submission.type} — {submission.taxYear}
        </p>
        <p className="text-xs text-muted-foreground">{submission.date}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-display font-bold text-card-foreground">{submission.amount}</p>
        {legacy ? (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            Legacy record — review needed
          </span>
        ) : (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {PREPARATION_STATUS_LABELS[status]}
          </span>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
};

export default SubmissionCard;
