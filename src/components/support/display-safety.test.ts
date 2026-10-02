import { describe, expect, it } from "vitest";
import { safeSupportDisplayText } from "./display-safety";

describe("safeSupportDisplayText", () => {
  it.each([
    ["assistant", "Your tax bill is NGN 4,000,000.", false],
    ["user", "My salary 4000000", false],
    ["assistant", "Your tax liability for 2025 is 4000000.", false],
    ["assistant", "The VAT registration threshold is NGN 25,000,000.", true],
    ["assistant", "The amount on your account is 4,000,000.", false],
    ["user", "The amount on your account is 4,000,000.", false],
    ["assistant", "Your account contains 4,000,000.", false],
    ["assistant", "Your account has\n4,000,000.", false],
    ["assistant", "Your account had 4,000,000.", false],
    ["assistant", "4,000,000 is in your account.", false],
    ["assistant", "Your account had\nNGN 4,000,000.", false],
    ["assistant", "₦4,000,000\nis in your account.", false],
    ["assistant", "Your account had 999.", false],
    ["assistant", "999 is in your account.", false],
    ["assistant", "Account holder: Ada Okafor", false],
    ["assistant", "Your account has 4m.", false],
    ["assistant", "4m is in your account.", false],
    ["assistant", "Your account has 1e6.", false],
    ["assistant", "Your account has four million naira.", false],
    ["assistant", "Your account has one thousand.", false],
    ["assistant", "Your account has 999.", false],
    ["assistant", "Where are my uploaded files?", false],
    ["assistant", "Are my documents safe?", false],
    ["assistant", "I reviewed your uploaded document and it is complete.", false],
    ["assistant", "What is in this attachment?", false],
    ["assistant", "Date of birth: 1990-01-01", false],
    ["assistant", "General tax guidance. Date of birth: 1990-01-01", false],
    ["assistant", "DOB = 1990-01-01", false],
  ] as const)("applies the %s privacy boundary to %s", (role, line, visible) => {
    expect(safeSupportDisplayText(line, role) === line).toBe(visible);
  });

  it("redacts user-entered amounts and identifiers while retaining the general question", () => {
    const text = [
      "Income: ₦4,000,000",
      "Salary is 4000000",
      "My tax liability for 2025 is 4000000.",
      "TIN: 123-456-789-01",
      "Phone: +234 801 234 5678",
      "Email: eddie@example.com",
      "What is income tax?",
    ].join("\n");
    expect(safeSupportDisplayText(text, "user")).toBe("I can help with general Nigerian tax information and high-level account status. Please contact human support for other needs.");
  });

  it("redacts direct personal financial statements in assistant messages", () => {
    const text = [
      "Your tax liability for 2025 is 4000000.",
      "Your income is NGN 4,000,000.",
      "Your income is 4000000.",
      "Income: ₦4,000,000",
      "Income tax applies to taxable earnings in Nigeria.",
    ].join("\n");
    const safe = safeSupportDisplayText(text, "assistant");
    expect(safe).toBe("I can help with general Nigerian tax information and high-level account status. Please contact human support for other needs.");
  });

  it("preserves public statutory monetary explanations in assistant messages", () => {
    const text = "The VAT registration threshold is NGN 25,000,000.";
    expect(safeSupportDisplayText(text, "assistant")).toBe(text);
    expect(safeSupportDisplayText("A TIN is a taxpayer identifier; VAT may apply at 7.5% under the relevant law.", "assistant"))
      .toContain("VAT may apply at 7.5%");
    expect(safeSupportDisplayText("VAT registration threshold is NGN 25,000,000.", "assistant"))
      .toBe("VAT registration threshold is NGN 25,000,000.");
    expect(safeSupportDisplayText("See https://firs.gov.ng/guides/vat.pdf for the official source.", "assistant"))
      .toBe("See https://firs.gov.ng/guides/vat.pdf for the official source.");
  });

  it("keeps the existing PII, document-content, and internal-workflow boundary on both roles", () => {
    const text = [
      "Email: eddie@example.com",
      "Document contents: private payslip text",
      "Internal workflow: invoke get_my_declaration_status()",
      "General Nigerian tax guidance is available.",
    ].join("\n");
    expect(safeSupportDisplayText(text, "user")).toBe("I can help with general Nigerian tax information and high-level account status. Please contact human support for other needs.");
    expect(safeSupportDisplayText(text, "assistant")).toBe("I can help with general Nigerian tax information and high-level account status. Please contact human support for other needs.");
  });

  it("fails closed for filenames and FileSmart operations on both roles", () => {
    const text = [
      "Document filename: salary-slip.pdf",
      "private-return.docx",
      "__salary.pdf",
      "résumé.pdf",
      "tax-return.odt",
      "Open the attachment payslip.jpg.",
      "FileSmart sends submissions through its compliance queue.",
      "FileSmart forwards uploaded forms to staff.",
      "FileSmart stores uploaded returns in a private database.",
      "FileSmart uses a triage team for returns.",
      "Name: Ada Okafor",
      "Address: 12 Market Street, Lagos",
      "General Nigerian tax guidance is available.",
    ].join("\n");
    expect(safeSupportDisplayText(text, "user")).toBe("I can help with general Nigerian tax information and high-level account status. Please contact human support for other needs.");
    expect(safeSupportDisplayText(text, "assistant")).toBe("I can help with general Nigerian tax information and high-level account status. Please contact human support for other needs.");
  });

  it("fails closed across long normalized line breaks for account amounts and document handling", () => {
    const text = [
      "General Nigerian tax guidance is available.",
      "Your account",
      "had",
      "this",
      "month",
      "999.",
      "Where are",
      "my uploaded",
      "documents",
      "kept?",
    ].join("\n");
    expect(safeSupportDisplayText(text, "assistant")).toBe("I can help with general Nigerian tax information and high-level account status. Please contact human support for other needs.");
  });

  it("preserves an official PDF citation while rejecting non-URL document content", () => {
    const citation = "See https://nass.gov.ng/guides/vat.pdf for the official source.";
    expect(safeSupportDisplayText(citation, "assistant")).toBe(citation);
    expect(safeSupportDisplayText("Your uploaded files are in the portal.", "assistant"))
      .toBe("I can help with general Nigerian tax information and high-level account status. Please contact human support for other needs.");
  });

  it("rejects embedded labeled DOB lines while preserving safe public education", () => {
    const text = "General Nigerian tax guidance is available.\nDate of birth: 1990-01-01";
    expect(safeSupportDisplayText(text, "assistant"))
      .toBe("I can help with general Nigerian tax information and high-level account status. Please contact human support for other needs.");
    const publicText = "The VAT registration threshold is NGN 25,000,000.";
    expect(safeSupportDisplayText(publicText, "assistant")).toBe(publicText);
  });
});
