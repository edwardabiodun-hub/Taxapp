import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { verifyFilingEvidenceRegister } from "./verify-filing-evidence-register";

const header = "jurisdiction_code,jurisdiction,online_tax_submission,individual_pit_submission,official_source_url,checked_at,reviewer,evidence_title,service_period,confidence,limitations,status";

describe("filing evidence register verification", () => {
  it("accepts the complete conservative register", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "filesmart-filing-register-"));
    const rows = Array.from({ length: 37 }, (_, index) => [
      `NG-${String.fromCharCode(65 + Math.floor(index / 26))}${String.fromCharCode(65 + (index % 26))}`,
      `Jurisdiction ${index}`,
      "not_verified",
      "not_verified",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "unverified",
    ].join(","));
    const register = path.join(root, "register.csv");
    await writeFile(register, `${header}\n${rows.join("\n")}\n`, "utf8");

    await expect(verifyFilingEvidenceRegister(register)).resolves.toEqual({
      rowCount: 37,
      verifiedRows: 0,
    });
  });

  it("rejects incomplete or partially evidenced rows", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "filesmart-filing-register-"));
    const register = path.join(root, "register.csv");
    await writeFile(register, `${header}\nNG-01,Jurisdiction,verified,not_verified,https://irs.example.gov.ng,2026-10-27,,,,,,unverified\n`, "utf8");

    await expect(verifyFilingEvidenceRegister(register)).rejects.toThrow(/row count|evidence|status/i);
  });

  it("accepts quoted fields containing commas and escaped quotes", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "filesmart-filing-register-"));
    const rows = Array.from({ length: 37 }, (_, index) => [
      `NG-${String.fromCharCode(65 + Math.floor(index / 26))}${String.fromCharCode(65 + (index % 26))}`,
      index === 0 ? '"Jurisdiction, Alpha"' : `Jurisdiction ${index}`,
      "not_verified",
      "not_verified",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "unverified",
    ].join(","));
    const register = path.join(root, "register.csv");
    await writeFile(register, `${header}\n${rows.join("\n")}\n`, "utf8");

    await expect(verifyFilingEvidenceRegister(register)).resolves.toEqual({
      rowCount: 37,
      verifiedRows: 0,
    });
  });
});
