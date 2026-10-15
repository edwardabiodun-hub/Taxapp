import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const entrypoint = readFileSync(
  resolve(process.cwd(), "supabase/functions/notify-launch-waitlist/index.ts"),
  "utf8",
);

describe("waitlist sender secret contract", () => {
  it("uses a launch-specific Resend key rather than the shared project key", () => {
    expect(entrypoint).toContain('"LAUNCH_RESEND_API_KEY"');
    expect(entrypoint).toContain("apiKey: values.LAUNCH_RESEND_API_KEY!");
    expect(entrypoint).not.toContain('"RESEND_API_KEY"');
  });
});
