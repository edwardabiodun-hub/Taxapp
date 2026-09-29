import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { sendSupportChatMessage, SupportChatError, type SupportChatResponse, type SupportChatTurn } from "@/lib/support-chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SupportChatMessage } from "./SupportChatMessage";
import { safeSupportDisplayText } from "./display-safety";

type Exchange = { question: string; answer: string; citations: SupportChatResponse["citations"]; accountContext: boolean };

const suggestions = [
  "What is personal income tax?",
  "What does tax year mean?",
  "What is my declaration status?",
];
const accountLabel = "Based on your synced FileSmart records.";

function isAccountStatusPrompt(message: string): boolean {
  const prompt = message.normalize("NFKC").replace(/\s+/g, " ").toLowerCase();
  return [
    /\b(?:status|progress)\b.{0,50}\b(?:my|our)\b.{0,40}\b(?:declaration|submission|return|filing|account)\b/,
    /\b(?:my|our)\b.{0,40}\b(?:declaration|submission|return|filing|account)\b.{0,40}\b(?:status|progress)\b/,
    /\b(?:how many|count|number of)\b.{0,60}\b(?:documents?|attachments?)\b.{0,40}\b(?:my|uploaded|attached|submission|declaration)\b/,
    /\b(?:my|our)\b.{0,40}\b(?:documents?|attachments?)\b.{0,40}\b(?:count|how many|number)\b/,
    /\b(?:unread|new)\b.{0,40}\b(?:support\s+)?messages?\b/,
    /\b(?:my|our)\b.{0,30}\bprofile\b.{0,30}\b(?:complete|completion|status|missing)\b/,
  ].some((pattern) => pattern.test(prompt));
}

function previousTurns(exchanges: Exchange[]): SupportChatTurn[] {
  return exchanges.slice(-6).flatMap(({ question, answer }): SupportChatTurn[] => [
    { role: "user", content: question }, { role: "assistant", content: answer },
  ]);
}

export function SupportChat({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const isMobile = useIsMobile();
  const { isUnlocked } = useAuth();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const focusLauncher = (event: Event) => {
    event.preventDefault();
    document.querySelector<HTMLButtonElement>('[aria-label="Open tax support assistant"]')?.focus();
  };

  async function submit(question: string) {
    const message = question.trim();
    if (!message || pending || !isUnlocked) return;
    setError("");
    setPending(message);
    try {
      const response = await sendSupportChatMessage({ message, history: previousTurns(exchanges) });
      const accountContext = isAccountStatusPrompt(message);
      const answer = safeSupportDisplayText(response.answer.startsWith(accountLabel) ? response.answer.slice(accountLabel.length).trim() : response.answer, "assistant");
      setExchanges((current) => [...current, { question: message, answer, citations: response.citations, accountContext }]);
      setDraft("");
    } catch (cause) {
      setError(cause instanceof SupportChatError ? cause.message : new SupportChatError("unavailable").message);
    } finally {
      setPending("");
      inputRef.current?.focus();
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(draft);
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit(draft);
    }
  }

  const body = (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1 px-4" aria-label="Tax support conversation">
        <div className="space-y-4 py-4" aria-live="polite">
          {exchanges.length === 0 && !pending && (
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              <p>Ask a question to get started.</p>
              <p className="mt-1">For legal advice or a complex situation, contact human support.</p>
            </div>
          )}
          {exchanges.map((exchange, index) => (
            <div key={index} className="space-y-3">
              <SupportChatMessage role="user" content={exchange.question} />
              <SupportChatMessage role="assistant" content={exchange.answer} citations={exchange.citations} accountContext={exchange.accountContext} />
            </div>
          ))}
          {pending && (
            <div className="space-y-3">
              <SupportChatMessage role="user" content={pending} />
              <div role="status" className="max-w-[90%] space-y-2 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                <span>Thinking…</span>
                <Skeleton className="h-3 w-44" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      {exchanges.length === 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3" aria-label="Suggested questions">
          {suggestions.map((suggestion) => (
            <Button key={suggestion} type="button" variant="outline" className="h-auto min-h-11 whitespace-normal text-left text-xs" disabled={!!pending} onClick={() => void submit(suggestion)}>
              {suggestion}
            </Button>
          ))}
        </div>
      )}
      <form onSubmit={onSubmit} className="border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {error && <p role="alert" className="mb-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <label htmlFor="support-chat-question" className="sr-only">Ask a tax question</label>
        <Textarea id="support-chat-question" ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={onInputKeyDown} placeholder="Ask about Nigerian tax or your account status" maxLength={2000} className="max-h-32 min-h-[80px] resize-none" disabled={!!pending || !isUnlocked} />
        <div className="mt-3 flex justify-end">
          <Button type="submit" className="min-h-11" disabled={!draft.trim() || !!pending || !isUnlocked} aria-label="Send question">Send</Button>
        </div>
      </form>
    </div>
  );

  if (isMobile) return (
    <Drawer open={open && isUnlocked} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent data-support-surface="mobile-drawer" className="h-[100dvh] max-h-[100dvh] rounded-none" onOpenAutoFocus={(event) => { event.preventDefault(); inputRef.current?.focus(); }} onCloseAutoFocus={focusLauncher}>
        <DrawerHeader className="relative border-b border-border text-left">
          <DrawerTitle>Tax Support</DrawerTitle>
          <DrawerDescription>General tax information, not professional tax advice.</DrawerDescription>
          <p className="text-xs text-muted-foreground">I can explain Nigerian tax topics and show high-level account status.</p>
          <Button type="button" variant="ghost" size="icon" className="absolute right-3 top-2 min-h-11 min-w-11" aria-label="Close tax support" onClick={() => onOpenChange(false)}><X /></Button>
        </DrawerHeader>
        {body}
      </DrawerContent>
    </Drawer>
  );

  return (
    <Sheet open={open && isUnlocked} onOpenChange={onOpenChange}>
      <SheetContent side="right" data-support-surface="desktop-sheet" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-md [&>button]:flex [&>button]:min-h-11 [&>button]:min-w-11 [&>button]:items-center [&>button]:justify-center" onOpenAutoFocus={(event) => { event.preventDefault(); inputRef.current?.focus(); }} onCloseAutoFocus={focusLauncher}>
        <SheetHeader className="border-b border-border p-4 pr-14 text-left">
          <SheetTitle>Tax Support</SheetTitle>
          <SheetDescription>General tax information, not professional tax advice.</SheetDescription>
          <p className="text-xs text-muted-foreground">I can explain Nigerian tax topics and show high-level account status.</p>
        </SheetHeader>
        {body}
      </SheetContent>
    </Sheet>
  );
}
