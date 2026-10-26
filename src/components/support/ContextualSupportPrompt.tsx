import { MessageCircleQuestion, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContextualSupportPrompt({
  onOpenSupport,
  onDismiss,
}: {
  onOpenSupport: () => void;
  onDismiss: () => void;
}) {
  return (
    <aside
      role="status"
      aria-label="Tax support help prompt"
      className="fixed bottom-24 right-4 z-30 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-4 shadow-elevated"
    >
      <button
        type="button"
        aria-label="Dismiss tax support suggestion"
        onClick={onDismiss}
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      <div className="flex gap-3 pr-5">
        <MessageCircleQuestion className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-foreground">Need help with this tax preparation?</p>
          <p className="mt-1 text-xs text-muted-foreground">I can explain the current step and what information you need next.</p>
          <Button type="button" size="sm" className="mt-3" onClick={onOpenSupport}>Open tax support</Button>
        </div>
      </div>
    </aside>
  );
}
