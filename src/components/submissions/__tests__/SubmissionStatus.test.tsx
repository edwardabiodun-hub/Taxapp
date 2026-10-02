import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SubmissionStatus from "@/components/submissions/SubmissionStatus";

describe("SubmissionStatus", () => {
  it("describes user submission as pending authority confirmation", () => {
    render(<SubmissionStatus status="user_submitted" />);

    expect(screen.getByText(/pending authority confirmation/i)).toBeInTheDocument();
    expect(screen.queryByText(/has not been submitted/i)).not.toBeInTheDocument();
  });
});
