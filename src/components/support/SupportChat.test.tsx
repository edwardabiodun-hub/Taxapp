import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useState } from "react";

const { send, mobile, unlocked } = vi.hoisted(() => ({ send: vi.fn(), mobile: { value: false }, unlocked: { value: true } }));
vi.mock("@/lib/support-chat", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/support-chat")>();
  return { ...actual, sendSupportChatMessage: send };
});
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => mobile.value }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ isUnlocked: unlocked.value, loading: false }) }));
vi.mock("@/contexts/SyncContext", () => ({ SyncProvider: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/components/layout/OfflineBanner", () => ({ default: () => null }));
vi.mock("@/hooks/use-local-data", () => ({ useUnreadMessageCount: () => 0 }));

import TopBar from "@/components/layout/TopBar";
import { SupportChat } from "./SupportChat";
import { SupportChatError } from "@/lib/support-chat";
import AppLayout from "@/components/layout/AppLayout";

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

  it.each([
    ["What is the status of Nigerian VAT reform?", false],
    ["What is my declaration status?", true],
  ])("labels account context only for an explicit account-status prompt: %s", async (question, expected) => {
    send.mockResolvedValue({ answer: "The status is under review.", citations: [] });
    openChat();
    fireEvent.change(screen.getByRole("textbox", { name: "Ask a tax question" }), { target: { value: question } });
    fireEvent.click(screen.getByRole("button", { name: "Send question" }));
    expect(await screen.findByText("The status is under review.")).toBeInTheDocument();
    expect(!!screen.queryByText("Based on your synced FileSmart records.")).toBe(expected);
  });

  it("filters exact values and sensitive text from both sides while keeping general tax guidance", async () => {
    send.mockResolvedValue({ answer: [
      "Income tax applies to taxable earnings in Nigeria.",
      "Income: ₦4,000,000",
      "Income 4,000,000",
      "Refund amount: NGN 250,000",
      "TIN: 123-456-789-01",
      "Phone: +234 801 234 5678",
      "Email: eddie@example.com",
      "Address: 12 Private Street",
      "Document contents: private payslip text",
      "Internal workflow: invoke get_my_declaration_status()",
      "The uploaded PDF says: confidential record text",
      "VAT is a consumption tax.",
      "A TIN is a taxpayer identifier; VAT may apply at 7.5% under the relevant law.",
    ].join("\n"), citations: [] });
    openChat();
    fireEvent.change(screen.getByRole("textbox", { name: "Ask a tax question" }), { target: { value: "Income: ₦4,000,000\nWhat is income tax?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send question" }));
    expect(await screen.findByText(/Income tax applies to taxable earnings/)).toBeInTheDocument();
    const conversation = screen.getByLabelText("Tax support conversation");
    expect(conversation).toHaveTextContent("What is income tax?");
    expect(conversation).toHaveTextContent("VAT is a consumption tax.");
    expect(conversation).toHaveTextContent("A TIN is a taxpayer identifier; VAT may apply at 7.5% under the relevant law.");
    expect(conversation).not.toHaveTextContent(/₦4,000,000|250,000|123-456-789-01|234 801|eddie@example.com|Private Street|private payslip|get_my_declaration_status|internal workflow|confidential record/i);
  });

  it("shows a public statutory threshold but hides direct personal financial answers", async () => {
    send.mockResolvedValue({ answer: [
      "The VAT registration threshold is NGN 25,000,000.",
      "Your tax bill is NGN 4,000,000.",
      "Your tax liability for 2025 is 4000000.",
      "Your income is NGN 4,000,000.",
    ].join("\n"), citations: [] });
    openChat();
    fireEvent.change(screen.getByRole("textbox", { name: "Ask a tax question" }), { target: { value: "My salary 4000000\nWhat is the VAT registration threshold?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send question" }));
    const answer = await screen.findByText("The VAT registration threshold is NGN 25,000,000.");
    expect(answer).toBeInTheDocument();
    expect(screen.getByLabelText("Tax support conversation")).not.toHaveTextContent(/My salary 4000000|Your tax bill is NGN 4,000,000|tax liability for 2025 is 4000000|Your income is NGN 4,000,000/i);
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

  it.each([
    ["authentication", /session has expired/i],
    ["rate_limit", /too many requests/i],
  ] as const)("shows the safe %s state", async (code, message) => {
    send.mockRejectedValue(new SupportChatError(code));
    openChat();
    fireEvent.change(screen.getByRole("textbox", { name: "Ask a tax question" }), { target: { value: "What is VAT?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send question" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
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

  it("gives the desktop Sheet close control a 44px keyboard target", () => {
    openChat();
    const dialog = screen.getByRole("dialog", { name: "Tax Support" });
    expect(dialog).toHaveClass("[&>button]:min-h-11", "[&>button]:min-w-11");
    const close = screen.getByRole("button", { name: "Close" });
    expect(dialog).toContainElement(close);
    close.focus();
    expect(close).toHaveFocus();
    fireEvent.click(close);
    expect(screen.queryByRole("dialog", { name: "Tax Support" })).not.toBeInTheDocument();
  });

  it("mounts support through AppLayout and keeps Messages navigation", () => {
    render(<MemoryRouter initialEntries={["/"]}><Routes>
      <Route element={<AppLayout />}>
        <Route index element={<div>Dashboard page</div>} />
        <Route path="messages" element={<div>Messages page</div>} />
      </Route>
    </Routes></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Messages" })).toHaveAttribute("href", "/messages");
    fireEvent.click(screen.getByRole("link", { name: "Messages" }));
    expect(screen.getByText("Messages page")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open tax support assistant" }));
    expect(screen.getByRole("dialog", { name: "Tax Support" })).toBeInTheDocument();
    expect(document.querySelector('a[href="/messages"]')).toBeInTheDocument();
  });
});
