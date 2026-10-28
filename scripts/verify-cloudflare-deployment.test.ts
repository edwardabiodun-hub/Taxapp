import { describe, expect, it, vi } from "vitest";
import { verifyDeployment } from "./verify-cloudflare-deployment.mjs";

describe("Cloudflare deployment verifier", () => {
  it("passes when public routes return 200 and an unknown route returns 404", async () => {
    const fetcher = vi.fn(async (url: string) => new Response("", {
      status: url.endsWith("/__filesmart_404_probe__") ? 404 : 200,
    }));

    const result = await verifyDeployment("https://staging.example.com", { fetcher });

    expect(result.pass).toBe(true);
    expect(result.routes).toHaveLength(7);
    expect(result.unknownRoute.status).toBe(404);
  });

  it("fails when the edge returns a SPA fallback for an unknown route", async () => {
    const fetcher = vi.fn(async () => new Response("", { status: 200 }));

    const result = await verifyDeployment("https://staging.example.com", { fetcher });

    expect(result.pass).toBe(false);
    expect(result.unknownRoute).toMatchObject({ status: 200, ok: false });
  });

  it("rejects non-HTTPS deployment targets", async () => {
    await expect(verifyDeployment("http://staging.example.com")).rejects.toThrow(/HTTPS/);
  });
});
