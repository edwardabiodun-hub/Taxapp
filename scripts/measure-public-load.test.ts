import { describe, expect, it } from "vitest";
import { measurePublicLoad } from "./measure-public-load.mjs";

describe("public load measurement", () => {
  it("measures HTML and same-origin assets for a route", async () => {
    const responses = new Map([
      ["https://preview.example/", '<!doctype html><script type="module" src="/assets/app.js"></script><link rel="stylesheet" href="/assets/app.css">'],
      ["https://preview.example/assets/app.js", "javascript"],
      ["https://preview.example/assets/app.css", "body{}"],
    ]);
    const fetcher = async (url: string) => new Response(responses.get(url) ?? "missing", { status: responses.has(url) ? 200 : 404 });

    const result = await measurePublicLoad("https://preview.example", ["/"], fetcher);

    expect(result.routes[0].page.status).toBe(200);
    expect(result.routes[0].assets).toHaveLength(2);
    expect(result.routes[0].sameOriginAssetBytes).toBe("javascript".length + "body{}".length);
  });

  it("rejects non-HTTP origins", async () => {
    await expect(measurePublicLoad("file:///tmp/site", ["/"])).rejects.toThrow("HTTP(S)");
  });
});
