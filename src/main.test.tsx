import { beforeEach, describe, expect, it, vi } from "vitest";

const render = vi.fn();
const createRoot = vi.fn(() => ({ render }));
const hydrateRoot = vi.fn();

vi.mock("react-dom/client", () => ({ createRoot, hydrateRoot }));
vi.mock("./App", () => ({ default: () => null }));

describe("application entrypoint", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    vi.clearAllMocks();
  });

  it("client-renders a public development shell when no prerendered markup exists", async () => {
    const { mountApp } = await import("./main");

    mountApp(document.getElementById("root")!, true);

    expect(createRoot).toHaveBeenCalledTimes(2);
    expect(hydrateRoot).not.toHaveBeenCalled();
  });

  it("hydrates public prerendered markup", async () => {
    const { mountApp } = await import("./main");
    const root = document.getElementById("root")!;
    root.innerHTML = "<main>prerendered page</main>";

    mountApp(root, true);

    expect(hydrateRoot).toHaveBeenCalledTimes(1);
  });
});
