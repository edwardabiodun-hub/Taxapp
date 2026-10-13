import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import * as supportChat from "@/lib/support-chat";
import SupportAssistant from "./SupportAssistant";

vi.mock("@/lib/support-chat", async () => {
  const actual = await vi.importActual<typeof import("@/lib/support-chat")>("@/lib/support-chat");
  return { ...actual, isSupportChatConfigured: vi.fn(() => false) };
});

describe("SupportAssistant", () => {
  it("offers help after inactivity and supports a quick answer", () => {
    vi.useFakeTimers();
    render(<MemoryRouter><SupportAssistant /></MemoryRouter>);

    expect(screen.queryByText(/need a hand/i)).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(45_000));
    expect(screen.getByText(/need a hand/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /open tax support/i }));
    expect(screen.getByRole("dialog", { name: /tax support/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /what is personal income tax/i }));
    expect(screen.getByText(/personal income tax is a tax on income earned by an individual/i)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("renders validated citations from the configured assistant", async () => {
    vi.mocked(supportChat.isSupportChatConfigured).mockReturnValue(true);
    vi.spyOn(supportChat, "sendSupportChatMessage").mockResolvedValue({
      answer: "Personal income tax is a tax on individual income.",
      citations: [{ label: "FIRS guidance", url: "https://firs.gov.ng/pit" }],
    });
    render(<MemoryRouter><SupportAssistant /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /open tax support/i }));
    fireEvent.click(screen.getByRole("button", { name: /what is personal income tax/i }));
    expect(await screen.findByText("FIRS guidance")).toHaveAttribute("href", "https://firs.gov.ng/pit");
  });
});
