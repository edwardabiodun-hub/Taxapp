import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Banknote } from "lucide-react";

import { TooltipProvider } from "@/components/ui/tooltip";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileMenu from "@/components/profile/ProfileMenu";
import StatCard from "@/components/dashboard/StatCard";
import DocumentsStep from "@/components/declaration/DocumentsStep";

describe("app-wide glossary coverage", () => {
  it("annotates shared domain content without annotating user document names", () => {
    const file = new File(["content"], "personal-tax-return.pdf", { type: "application/pdf" });

    render(
      <MemoryRouter>
        <TooltipProvider>
          <ProfileHeader name="Ada" email="ada@example.com" taxId="TIN-123" />
          <StatCard icon={Banknote} label="Tax Paid" value="₦0" subtitle="This year" />
          <ProfileMenu />
          <DocumentsStep
            declarationId="declaration-1"
            documents={[{ id: "document-1", file, category: "receipt" }]}
            onDocumentsChange={() => undefined}
          />
        </TooltipProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Learn about Tax ID" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Learn about Tax paid" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Learn about Supporting documents" })).toHaveLength(2);
    expect(screen.getByText("personal-tax-return.pdf")).toBeInTheDocument();
    expect(screen.getByText("personal-tax-return.pdf").closest("button")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));
    expect(screen.getByRole("button", { name: "Learn about Tax declaration" })).toBeInTheDocument();
  });
});
