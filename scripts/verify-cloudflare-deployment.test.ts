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

  it("follows same-origin canonical redirects before evaluating public routes", async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith("/calculator")) {
        return new Response("", { status: 308, headers: { location: "/calculator/" } });
      }
      return new Response("", {
        status: url.endsWith("/__filesmart_404_probe__") ? 404 : 200,
      });
    });

    const result = await verifyDeployment("https://staging.example.com", { fetcher });

    expect(result.pass).toBe(true);
    expect(result.routes.find((route) => route.route === "/calculator")).toMatchObject({
      status: 200,
      initialStatus: 308,
      redirects: ["/calculator/"],
      ok: true,
    });
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
