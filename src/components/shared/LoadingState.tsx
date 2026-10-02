import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface StateAction {
  readonly label: string;
  readonly onClick: () => void;
}

interface LoadingStateProps {
  readonly title?: string;
  readonly message?: string;
  readonly action?: StateAction;
  readonly className?: string;
}

const LoadingState = ({
  title = "Loading",
  message = "Please wait while we prepare this section.",
  action,
  className,
}: LoadingStateProps) => (
  <div
    role="status"
    aria-live="polite"
    className={cn("flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3", className)}
  >
    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="break-words text-xs text-muted-foreground">{message}</p>
    </div>
    {action && (
      <Button type="button" variant="outline" size="sm" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </div>
);

export default LoadingState;
