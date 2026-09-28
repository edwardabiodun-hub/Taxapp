import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { GlossaryEntry } from "@/lib/glossary";

interface GlossaryTooltipProps {
  entry: GlossaryEntry;
  children: ReactNode;
}

export function GlossaryTooltip({ entry, children }: GlossaryTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={open} onOpenChange={setOpen} delayDuration={150}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`Learn about ${entry.term}`}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
            }
          }}
          className={cn(
            "inline rounded-sm border-0 border-b border-dotted border-primary/60 bg-transparent p-0 font-inherit text-inherit",
            "cursor-help transition-colors hover:border-primary hover:bg-primary/5",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent
        role="tooltip"
        onEscapeKeyDown={() => setOpen(false)}
        className="max-w-[min(20rem,calc(100vw-2rem))] space-y-1.5 text-left"
      >
        <p className="leading-relaxed">{entry.definition}</p>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          <span className="font-semibold">Reference:</span> {entry.statutoryReference}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
