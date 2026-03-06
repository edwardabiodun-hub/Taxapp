import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, AlertCircle, ChevronRight } from "lucide-react";

export interface SubmissionItem {
  id: string;
  taxYear: string;
  type: string;
  status: "draft" | "submitted" | "processing" | "audit_request" | "approved";
  date: string;
  amount: string;
}

const statusConfig = {
  draft: { icon: Clock, label: "Draft", className: "bg-muted text-muted-foreground" },
  submitted: { icon: Clock, label: "Submitted", className: "bg-info/10 text-info" },
  processing: { icon: Clock, label: "Processing", className: "bg-warning/10 text-warning" },
  audit_request: { icon: AlertCircle, label: "Audit Request", className: "bg-destructive/10 text-destructive" },
  approved: { icon: CheckCircle2, label: "Approved", className: "bg-success/10 text-success" },
};

interface SubmissionCardProps {
  submission: SubmissionItem;
  onClick?: () => void;
}

const SubmissionCard = ({ submission, onClick }: SubmissionCardProps) => {
  const config = statusConfig[submission.status];
  const StatusIcon = config.icon;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 bg-card rounded-xl shadow-card hover:shadow-elevated transition-all text-left"
    >
      <div className={cn("p-2 rounded-lg", config.className)}>
        <StatusIcon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-card-foreground truncate">
          {submission.type} — {submission.taxYear}
        </p>
        <p className="text-xs text-muted-foreground">{submission.date}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-display font-bold text-card-foreground">{submission.amount}</p>
        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", config.className)}>
          {config.label}
        </span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
};

export default SubmissionCard;
