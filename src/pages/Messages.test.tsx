import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

describe("Messages", () => {
  beforeEach(async () => {
    const { db } = await import("@/lib/local-db");
    await db.messages.clear();
    await db.declarations.clear();
  });

  it("shows an empty state when there are no messages", async () => {
    const { default: Messages } = await import("./Messages");
    render(<Messages />);

    await waitFor(() => expect(screen.getByText(/no messages yet/i)).toBeInTheDocument());
  });

  it("marks a message read and reveals its body when tapped", async () => {
    const { db } = await import("@/lib/local-db");
    const { default: Messages } = await import("./Messages");

    await db.messages.put({
      id: "msg-1",
      category: "document_request",
      subject: "We need a document from you",
      body: "Please upload your payslip for 2025.",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 0,
    });

    render(<Messages />);
    await waitFor(() => expect(screen.getByText("We need a document from you")).toBeInTheDocument());

    fireEvent.click(screen.getByText("We need a document from you"));

    await waitFor(() => expect(screen.getByText("Please upload your payslip for 2025.")).toBeInTheDocument());
    await waitFor(async () => {
      const stored = await db.messages.get("msg-1");
      expect(stored?.readAt).toBeDefined();
      expect(stored?.pendingSync).toBe(1);
    });
  });

  it("shows the linked declaration's context when a message references one", async () => {
    const { db } = await import("@/lib/local-db");
    const { default: Messages } = await import("./Messages");

    await db.declarations.put({
      id: "decl-1",
      taxYear: "2025",
      country: "ng",
      type: "Income Tax",
      status: "processing",
      formData: {},
      documents: [],
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      pendingSync: 0,
    });
    await db.messages.put({
      id: "msg-2",
      declarationId: "decl-1",
      category: "refund_status",
      subject: "Your refund is on its way",
      body: "We've approved your refund.",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 0,
    });

    render(<Messages />);

    await waitFor(() => expect(screen.getByText(/re: income tax — 2025/i)).toBeInTheDocument());
  });

  it("shows no filing-context line for a general message with no linked declaration", async () => {
    const { db } = await import("@/lib/local-db");
    const { default: Messages } = await import("./Messages");

    await db.messages.put({
      id: "msg-3",
      category: "general",
      subject: "Welcome to FileSmart",
      body: "Thanks for signing up.",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 0,
    });

    render(<Messages />);

    await waitFor(() => expect(screen.getByText("Welcome to FileSmart")).toBeInTheDocument());
    expect(screen.queryByText(/^re:/i)).not.toBeInTheDocument();
  });

  it("falls back to a default rendering for an unrecognized category instead of crashing", async () => {
    const { db } = await import("@/lib/local-db");
    const { default: Messages } = await import("./Messages");

    // Cast bypasses the LocalMessage type on purpose — this simulates a
    // category value the server added after this client shipped.
    await db.messages.put({
      id: "msg-4",
      category: "future_category" as never,
      subject: "A brand new kind of message",
      body: "b",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 0,
    });

    render(<Messages />);

    await waitFor(() => expect(screen.getByText("A brand new kind of message")).toBeInTheDocument());
  });
});
