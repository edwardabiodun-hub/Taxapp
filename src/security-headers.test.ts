import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Netlify security headers", () => {
  it("sets browser hardening and a Supabase-compatible CSP", () => {
    const headers = readFileSync(resolve(process.cwd(), "public/_headers"), "utf8");

    expect(headers).toContain("X-Content-Type-Options: nosniff");
    expect(headers).toContain("Content-Security-Policy:");
    expect(headers).toContain("connect-src 'self' https://*.supabase.co wss://*.supabase.co");
    expect(headers).toContain("object-src 'none'");
  });
});
