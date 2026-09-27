import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("runtime dependency floors", () => {
  it("uses a patched React Router 6.x release", () => {
    const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
    };
    const version = packageJson.dependencies["react-router-dom"].replace(/^[^0-9]*/, "");
    const [major, minor, patch] = version.split(".").map(Number);

    expect(major).toBe(6);
    expect(minor).toBe(30);
    expect(patch).toBeGreaterThanOrEqual(4);
  });

  it("pins the Supabase Edge Function import to an exact version", () => {
    const denoJson = JSON.parse(
      readFileSync(resolve(process.cwd(), "supabase/functions/deno.json"), "utf8"),
    ) as { imports: Record<string, string> };

    expect(denoJson.imports["@supabase/supabase-js"]).toBe(
      "https://esm.sh/@supabase/supabase-js@2.117.1",
    );
  });
});
