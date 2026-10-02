import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StateAction } from "@/components/shared/LoadingState";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  readonly title?: string;
  readonly message?: string;
  readonly action?: StateAction;
  readonly className?: string;
}

const EmptyState = ({
  title = "Nothing to show yet",
  message = "There is no information available for this selection.",
  action,
  className,
}: EmptyStateProps) => (
  <div className={cn("rounded-lg border border-dashed border-border bg-muted/30 p-4", className)}>
    <div className="flex items-start gap-3">
      <Inbox className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="break-words text-xs text-muted-foreground">{message}</p>
        {action && (
          <Button type="button" variant="outline" size="sm" onClick={action.onClick} className="mt-3">
            {action.label}
          </Button>
        )}
      </div>
    </div>
  </div>
);

export default EmptyState;
