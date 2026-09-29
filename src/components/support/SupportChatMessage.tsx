import type { SupportChatResponse } from "@/lib/support-chat";
import { safeSupportDisplayText, type SupportDisplayRole } from "./display-safety";

interface SupportChatMessageProps {
  role: SupportDisplayRole;
  content: string;
  citations?: SupportChatResponse["citations"];
  accountContext?: boolean;
}

export function SupportChatMessage({ role, content, citations = [], accountContext = false }: SupportChatMessageProps) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[90%] min-w-0 rounded-2xl px-4 py-3 text-sm ${role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
        {accountContext && <p className="mb-2 text-xs font-medium text-muted-foreground">Based on your synced FileSmart records.</p>}
        <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{safeSupportDisplayText(content, role)}</p>
        {citations.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Sources">
            {citations.map(({ label, url }) => (
              <a key={`${url}-${label}`} href={url} target="_blank" rel="noopener noreferrer" className="rounded-md border border-border bg-background px-2 py-1 text-xs text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [overflow-wrap:anywhere]">
                {safeSupportDisplayText(label, "assistant")}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
