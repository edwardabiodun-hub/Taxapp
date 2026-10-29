import { createRoot, hydrateRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-dom/client", () => ({
  createRoot: vi.fn(() => ({ render: vi.fn() })),
  hydrateRoot: vi.fn(),
}));

vi.mock("./PublicApp", () => ({ default: () => null }));

describe("public entrypoint", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"><main>prerendered content</main></div>';
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("uses a client render for prerendered markup so interactive handlers attach", async () => {
    await import("./public-main");

    expect(createRoot).toHaveBeenCalledTimes(1);
    expect(hydrateRoot).not.toHaveBeenCalled();
  });
});
