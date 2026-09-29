import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useState } from "react";

const { send, mobile, unlocked } = vi.hoisted(() => ({ send: vi.fn(), mobile: { value: false }, unlocked: { value: true } }));
vi.mock("@/lib/support-chat", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/support-chat")>();
  return { ...actual, sendSupportChatMessage: send };
});
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => mobile.value }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ isUnlocked: unlocked.value, loading: false }) }));

import TopBar from "@/components/layout/TopBar";
import { SupportChat } from "./SupportChat";
import { SupportChatError } from "@/lib/support-chat";

function Harness() {
  const [open, setOpen] = useState(false);
  return <MemoryRouter><TopBar supportOpen={open} onOpenSupport={() => setOpen(true)} /><SupportChat open={open} onOpenChange={setOpen} /></MemoryRouter>;
}

function openChat() {
  const view = render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Open tax support assistant" }));
  return view;
}

describe("SupportChat surface", () => {
  beforeEach(() => { send.mockReset(); mobile.value = false; unlocked.value = true; });

  it("opens an accessible dialog with safe guidance and three suggested topics", () => {
    openChat();
    const launcher = document.querySelector<HTMLButtonElement>('[aria-label="Open tax support assistant"]');
    expect(launcher).toHaveAttribute("aria-haspopup", "dialog");
    expect(launcher).toHaveAttribute("aria-expanded", "true");
    expect(launcher).toHaveClass("min-h-11", "min-w-11");
    expect(screen.getByRole("dialog", { name: "Tax Support" })).toBeInTheDocument();
    expect(screen.getByText("General tax information, not professional tax advice.")).toBeInTheDocument();
    expect(screen.getByText("I can explain Nigerian tax topics and show high-level account status.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /personal income tax/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tax year/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /declaration status/i })).toBeInTheDocument();
    expect(screen.queryByText(/internal workflow|provider|service.role|indexeddb/i)).not.toBeInTheDocument();
  });

  it("submits a question, shows progress, then renders plain answer and safe citations", async () => {
    let resolve!: (value: unknown) => void;
    send.mockReturnValue(new Promise((done) => { resolve = done; }));
    openChat();
    fireEvent.change(screen.getByRole("textbox", { name: "Ask a tax question" }), { target: { value: "What is VAT?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send question" }));
    expect(screen.getByRole("status")).toHaveTextContent(/thinking/i);
    expect(send).toHaveBeenCalledWith({ message: "What is VAT?", history: [] });
    resolve({ answer: "VAT is a consumption tax. <script>alert(1)</script>", citations: [{ label: "VAT Act", url: "https://firs.gov.ng/vat" }], account: { phone: "08012345678", income: 999999 } });
    expect(await screen.findByText(/VAT is a consumption tax/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "VAT Act" })).toHaveAttribute("href", "https://firs.gov.ng/vat");
    expect(document.querySelector("script")).toBeNull();
    expect(screen.queryByText(/08012345678|999999/)).not.toBeInTheDocument();
  });

  it("shows the account-context label for status answers but no private fields", async () => {
    send.mockResolvedValue({ answer: "Based on your synced FileSmart records. Your declaration is submitted.", citations: [], rawProfile: { taxId: "12345678901", phone: "08012345678", amount: 750000 } });
    openChat();
    fireEvent.click(screen.getByRole("button", { name: /declaration status/i }));
    expect(await screen.findByText("Your declaration is submitted.")).toBeInTheDocument();
    expect(screen.getByText("Based on your synced FileSmart records.")).toBeInTheDocument();
    expect(screen.queryByText(/12345678901|08012345678|750000|tax ID|phone|amount|income|form data|document contents/i)).not.toBeInTheDocument();
  });

  it("shows safe offline and provider errors without revealing details", async () => {
    send.mockRejectedValueOnce(new SupportChatError("offline"));
    openChat();
    fireEvent.change(screen.getByRole("textbox", { name: "Ask a tax question" }), { target: { value: "VAT?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send question" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/offline/i);
    send.mockRejectedValueOnce(new Error("provider key sk-secret"));
    fireEvent.click(screen.getByRole("button", { name: "Send question" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/unavailable/i);
    expect(screen.queryByText(/sk-secret/)).not.toBeInTheDocument();
  });

  it("offers human support when an answer refuses or cannot confirm a question", async () => {
    send.mockResolvedValue({ answer: "I cannot help with that request. Please contact human support.", citations: [] });
    openChat();
    fireEvent.change(screen.getByRole("textbox", { name: "Ask a tax question" }), { target: { value: "Can you advise me?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send question" }));
    expect(await screen.findByText(/I cannot help with that request/)).toBeInTheDocument();
    expect(screen.getByText(/contact human support/i)).toBeInTheDocument();
  });

  it("uses a right sheet on desktop and a full-height bottom drawer on mobile", () => {
    const view = openChat();
    expect(screen.getByRole("dialog", { name: "Tax Support" })).toHaveAttribute("data-support-surface", "desktop-sheet");
    view.unmount();
    mobile.value = true;
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Open tax support assistant" }));
    expect(screen.getByRole("dialog", { name: "Tax Support" })).toHaveAttribute("data-support-surface", "mobile-drawer");
  });

  it("closes with Escape and returns keyboard focus to the launcher", async () => {
    openChat();
    expect(screen.getByRole("textbox", { name: "Ask a tax question" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Tax Support" })).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Open tax support assistant" })).toHaveFocus();
  });
});
