import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXPECTED_HEADER = [
  "jurisdiction_code",
  "jurisdiction",
  "online_tax_submission",
  "individual_pit_submission",
  "official_source_url",
  "checked_at",
  "reviewer",
  "evidence_title",
  "service_period",
  "confidence",
  "limitations",
  "status",
];

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let inQuotes = false;
  let justClosedQuote = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (inQuotes) {
      if (character === '"') {
        if (line[index + 1] === '"') {
          value += '"';
          index += 1;
        } else {
          inQuotes = false;
          justClosedQuote = true;
        }
      } else {
        value += character;
      }
      continue;
    }

    if (character === ",") {
      values.push(value.trim());
      value = "";
      justClosedQuote = false;
      continue;
    }

    if (character === '"') {
      assert(value.trim() === "" && !justClosedQuote, "filing evidence register contains an invalid quoted field");
      value = "";
      inQuotes = true;
      continue;
    }

    assert(!justClosedQuote || /\s/.test(character), "filing evidence register contains characters after a quoted field");
    value += character;
  }

  assert(!inQuotes, "filing evidence register contains an unclosed quoted field");
  values.push(value.trim());
  return values;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export async function verifyFilingEvidenceRegister(filePath) {
  const lines = (await readFile(filePath, "utf8"))
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  assert(lines.length > 0, "filing evidence register is empty");

  const header = parseCsvLine(lines[0]);
  assert(header.join("|") === EXPECTED_HEADER.join("|"), "filing evidence register header is invalid");

  const rows = lines.slice(1).map(parseCsvLine);
  assert(rows.length === 37, `filing evidence register must contain 37 rows, found ${rows.length}`);

  const codes = new Set();
  let verifiedRows = 0;
  for (const [index, row] of rows.entries()) {
    assert(row.length === EXPECTED_HEADER.length, `filing evidence row ${index + 2} has the wrong column count`);
    const [code, jurisdiction, onlineStatus, pitStatus, source, checkedAt, reviewer, title, period, confidence, limitations, status] = row;
    assert(/^NG-[A-Z]{2,3}$/.test(code), `filing evidence row ${index + 2} has an invalid jurisdiction code`);
    assert(!codes.has(code), `filing evidence register contains duplicate ${code}`);
    codes.add(code);
    assert(jurisdiction.length > 0, `filing evidence row ${index + 2} has no jurisdiction name`);
    assert(["verified", "not_verified"].includes(onlineStatus), `filing evidence row ${index + 2} has an invalid online status`);
    assert(["verified", "not_verified"].includes(pitStatus), `filing evidence row ${index + 2} has an invalid PIT status`);

    const hasVerifiedClaim = onlineStatus === "verified" || pitStatus === "verified";
    if (!hasVerifiedClaim) {
      assert(status === "unverified", `unverified filing evidence row ${index + 2} must have status unverified`);
      assert([source, checkedAt, reviewer, title, period, confidence, limitations].every((value) => value === ""), `unverified filing evidence row ${index + 2} contains partial evidence`);
      continue;
    }

    verifiedRows += 1;
    assert(status === "verified", `verified filing evidence row ${index + 2} must have status verified`);
    assert(/^https:\/\/[^,]+\.gov\.ng(?:\/|$)/i.test(source), `verified filing evidence row ${index + 2} needs an HTTPS .gov.ng source`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(checkedAt), `verified filing evidence row ${index + 2} needs a review date`);
    assert([reviewer, title, period, confidence, limitations].every((value) => value.length > 0), `verified filing evidence row ${index + 2} is incomplete`);
    assert(["high", "medium", "low"].includes(confidence), `verified filing evidence row ${index + 2} has invalid confidence`);
  }

  return { rowCount: rows.length, verifiedRows };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const filePath = path.resolve(process.argv[2] ?? "docs/filing-directory-evidence-register.csv");
  const result = await verifyFilingEvidenceRegister(filePath);
  console.log(JSON.stringify(result));
}
