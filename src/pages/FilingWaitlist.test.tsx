import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FilingWaitlist from "./FilingWaitlist";

const { joinLaunchWaitlist } = vi.hoisted(() => ({ joinLaunchWaitlist: vi.fn() }));

vi.mock("@/lib/waitlist", () => ({
  joinLaunchWaitlist,
}));

describe("FilingWaitlist", () => {
  beforeEach(() => {
    joinLaunchWaitlist.mockReset();
    joinLaunchWaitlist.mockResolvedValue({ status: "joined" });
  });

  it("submits a filing interest request and shows confirmation", async () => {
    render(<MemoryRouter><FilingWaitlist /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "amara@example.com" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /notify me/i }));
    fireEvent.submit(screen.getByRole("button", { name: /join filing waitlist/i }).closest("form")!);

    expect(joinLaunchWaitlist).toHaveBeenCalledWith({
      email: "amara@example.com",
      name: "",
      source: "filing-cta",
      notificationConsent: true,
    });
    expect(await screen.findByRole("heading", { name: /you're on the list/i })).toBeInTheDocument();
  });

  it("requires notification consent before submission", async () => {
    render(<MemoryRouter><FilingWaitlist /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "amara@example.com" } });
    fireEvent.submit(screen.getByRole("button", { name: /join filing waitlist/i }).closest("form")!);

    expect(joinLaunchWaitlist).not.toHaveBeenCalled();
    expect(screen.getByText(/please agree to be notified/i)).toBeInTheDocument();
  });

  it("promises only the launch notification requested by the user", () => {
    render(<MemoryRouter><FilingWaitlist /></MemoryRouter>);

    expect(screen.getByText(/use your email for the FileSmart filing launch notification you requested/i)).toBeInTheDocument();
    expect(screen.queryByText(/related FileSmart updates|opt out later/i)).not.toBeInTheDocument();
  });
});
