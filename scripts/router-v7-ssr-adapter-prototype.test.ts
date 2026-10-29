import { createElement } from "react";
import { describe, expect, it } from "vitest";
import {
  createStaticRouterElement,
  resolveStaticRouter,
} from "./router-v7-ssr-adapter-prototype";

function NamedStaticRouter() {
  return null;
}

function DefaultStaticRouter() {
  return null;
}

describe("React Router v7 SSR adapter prototype", () => {
  it("resolves the named StaticRouter export used by the v7 server boundary", () => {
    expect(resolveStaticRouter({ StaticRouter: NamedStaticRouter })).toBe(NamedStaticRouter);
  });

  it("accepts a namespace-shaped default export for bundler interop", () => {
    expect(resolveStaticRouter({ default: { StaticRouter: DefaultStaticRouter } })).toBe(DefaultStaticRouter);
  });

  it("rejects a server module without a usable StaticRouter export", () => {
    expect(() => resolveStaticRouter({})).toThrowError(/StaticRouter export/);
  });

  it("creates a router element without changing the caller's route tree", () => {
    const element = createStaticRouterElement(
      { StaticRouter: NamedStaticRouter },
      "/calculator",
      createElement("main", null, "content"),
    );

    expect(element.type).toBe(NamedStaticRouter);
    expect(element.props.location).toBe("/calculator");
    expect(element.props.children.type).toBe("main");
  });
});
