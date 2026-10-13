import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSupportChatConfigured, sendSupportChatMessage, SupportChatError, type SupportChatTurn } from "@/lib/support-chat";

const quickPrompts = [
  "What is personal income tax?",
  "What should I prepare before filing?",
  "How can I estimate my tax?",
];

const fallbackAnswer = (question: string) => {
  const normalized = question.toLowerCase();
  if (normalized.includes("personal income") || normalized.includes("pit")) {
    return "Personal income tax is a tax on income earned by an individual. The applicable treatment depends on your income, residence, filing route, and current Nigerian rules.";
  }
  if (normalized.includes("prepare") || normalized.includes("before filing")) {
    return "Have your taxpayer details, income records, eligible deductions, and supporting documents available. FileSmart can help you organize the information before you review the next filing step.";
  }
  if (normalized.includes("estimate") || normalized.includes("calculator")) {
    return "You can use the Tax Estimator to explore an indicative calculation. It is educational and should be checked against the applicable authority or a qualified adviser before filing.";
  }
  return "I can explain general Nigerian tax topics and help you find the right FileSmart starting point. For complex or disputed situations, contact a qualified adviser or the relevant tax authority.";
};

const SupportAssistant = () => {
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "assistant" | "user"; text: string; citations?: { label: string; url: string }[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const resetInactivityTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setNudge(true), 45_000);
    };

    resetInactivityTimer();
    window.addEventListener("pointerdown", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("pointerdown", resetInactivityTimer);
      window.removeEventListener("keydown", resetInactivityTimer);
    };
  }, []);

  const sendMessage = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      if (isSupportChatConfigured()) {
        const history: SupportChatTurn[] = messages.map((message) => ({
          role: message.role,
          content: message.text,
        }));
        const response = await sendSupportChatMessage({ message: trimmed, history });
        setMessages((current) => [...current, { role: "assistant", text: response.answer, citations: response.citations }]);
      } else {
        setMessages((current) => [...current, { role: "assistant", text: fallbackAnswer(trimmed) }]);
      }
    } catch (error) {
      const message = error instanceof SupportChatError ? error.message : "Tax support is unavailable right now. Please try again later or contact human support.";
      setMessages((current) => [...current, { role: "assistant", text: message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
      {nudge && !open && (
        <div className="max-w-xs rounded-2xl border border-[#b9cec3] bg-white p-4 text-sm text-[#12352f] shadow-[0_16px_40px_rgba(18,53,47,0.18)]">
          <p className="font-semibold">Need a hand?</p>
          <p className="mt-1 text-[#55736c]">Ask a general tax question before you continue.</p>
        </div>
      )}
      {open && (
        <div role="dialog" aria-label="Tax support" className="flex w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-[#b9cec3] bg-[#fbfdf9] shadow-[0_20px_60px_rgba(18,53,47,0.2)]">
          <div className="flex items-center justify-between bg-[#12352f] px-4 py-3 text-[#fbfaf5]">
            <div><p className="font-bold">Tax support</p><p className="text-xs text-[#b9d2c5]">General information only</p></div>
            <button type="button" aria-label="Close tax support" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-white/10"><X className="h-4 w-4" /></button>
          </div>
          <div className="max-h-72 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.length === 0 && <p className="text-sm text-[#55736c]">Ask about Nigerian tax topics, preparation, or where to begin.</p>}
            {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`rounded-2xl px-3 py-2 text-sm ${message.role === "user" ? "ml-6 bg-[#e8f2eb] text-[#12352f]" : "mr-6 bg-white text-[#55736c]"}`}>
              <p>{message.text}</p>
              {message.citations && message.citations.length > 0 && <div className="mt-2 space-y-1 border-t border-[#e0e9e1] pt-2 text-xs">
                <p className="font-semibold text-[#12352f]">Sources</p>
                {message.citations.map((citation) => <a key={citation.url} href={citation.url} target="_blank" rel="noreferrer" className="block truncate text-[#176b57] underline hover:text-[#12352f]">{citation.label}</a>)}
              </div>}
            </div>)}
            {loading && <p className="text-xs text-[#55736c]">Preparing an answer…</p>}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-[#e0e9e1] p-3">
            {messages.length === 0 && quickPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => void sendMessage(prompt)} className="rounded-full border border-[#b9cec3] px-3 py-2 text-left text-xs text-[#12352f] hover:bg-[#edf4ee]">{prompt}</button>)}
            <form className="flex w-full gap-2" onSubmit={(event) => { event.preventDefault(); void sendMessage(input); }}>
              <input value={input} onChange={(event) => setInput(event.target.value)} aria-label="Ask tax support" placeholder="Ask a question…" className="min-w-0 flex-1 rounded-full border border-[#b9cec3] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#d48a18]" />
              <Button type="submit" size="icon" aria-label="Send question" className="rounded-full bg-[#12352f] hover:bg-[#1c4e44]"><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        </div>
      )}
      <button type="button" aria-label="Open tax support" onClick={() => { setOpen(true); setNudge(false); }} className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d48a18] text-[#12352f] shadow-[0_10px_30px_rgba(18,53,47,0.2)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12352f] focus-visible:ring-offset-2">
        {open ? <X className="h-6 w-6" /> : <><MessageCircle className="h-6 w-6" /><Sparkles className="absolute mb-8 ml-8 h-4 w-4" /></>}
      </button>
    </div>
  );
};

export default SupportAssistant;
