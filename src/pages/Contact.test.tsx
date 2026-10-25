import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Contact from "./Contact";

const { submitContactMessage } = vi.hoisted(() => ({ submitContactMessage: vi.fn() }));

vi.mock("@/lib/contact", () => ({ submitContactMessage }));

describe("Contact page", () => {
  beforeEach(() => submitContactMessage.mockReset());

  it("shows the clickable support email and sends the completed inquiry", async () => {
    submitContactMessage.mockResolvedValue(undefined);
    render(<MemoryRouter><Contact /></MemoryRouter>);

    expect(screen.getByRole("link", { name: "hello@filesmartnaija.com" })).toHaveAttribute("href", "mailto:hello@filesmartnaija.com");
    expect(screen.getByText(/tax identification number/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Ada Okafor" } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "ada@example.com" } });
    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: "Account question" } });
    fireEvent.change(screen.getByLabelText(/^message$/i), { target: { value: "I need help understanding how to get started." } });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => expect(submitContactMessage).toHaveBeenCalledWith({
      name: "Ada Okafor",
      email: "ada@example.com",
      subject: "Account question",
      message: "I need help understanding how to get started.",
    }, ""));
    expect(await screen.findByRole("status")).toHaveTextContent(/message has been sent/i);
  });
});
