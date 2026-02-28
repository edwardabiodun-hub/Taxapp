import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, AlertCircle, ChevronRight } from "lucide-react";

export interface SubmissionItem {
  id: string;
  taxYear: string;
  type: string;
  status: "submitted" | "processing" | "approved" | "rejected";
  date: string;
  amount: string;
}

const statusConfig = {
  submitted: { icon: Clock, label: "Submitted", className: "bg-info/10 text-info" },
  processing: { icon: Clock, label: "Processing", className: "bg-warning/10 text-warning" },
  approved: { icon: CheckCircle2, label: "Approved", className: "bg-success/10 text-success" },
  rejected: { icon: AlertCircle, label: "Rejected", className: "bg-destructive/10 text-destructive" },
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
