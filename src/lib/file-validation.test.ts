import { describe, expect, it } from "vitest";
import { validateDocumentFile } from "./file-validation";

function file(name: string, type: string, size = 1024): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe("validateDocumentFile", () => {
  it("accepts an allowed extension only when its MIME type matches", () => {
    expect(validateDocumentFile(file("receipt.pdf", "application/pdf"))).toEqual({ valid: true });
    expect(validateDocumentFile(file("receipt.pdf", "image/png")).valid).toBe(false);
  });

  it("rejects executable extensions even when the browser reports a generic MIME type", () => {
    const result = validateDocumentFile(file("invoice.exe", "application/octet-stream"));

    expect(result).toEqual({ valid: false, reason: "unsupported-type" });
  });

  it("rejects files larger than the shared ten megabyte limit", () => {
    const result = validateDocumentFile(file("statement.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 10 * 1024 * 1024 + 1));

    expect(result).toEqual({ valid: false, reason: "too-large" });
  });
});
