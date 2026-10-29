import { createElement, type ReactNode } from "react";

type StaticRouterProps = {
  location: string;
  children?: ReactNode;
};

export type StaticRouterComponent = (props: StaticRouterProps) => ReactNode;

type ServerModule = {
  StaticRouter?: unknown;
  default?: {
    StaticRouter?: unknown;
  };
};

function isStaticRouterComponent(value: unknown): value is StaticRouterComponent {
  return typeof value === "function";
}

/**
 * Resolve the SSR router export at the adapter boundary.
 *
 * React Router v7's server entrypoint and Vite SSR interop can expose the
 * component as either a named export or a namespace-shaped default export.
 * Keeping that resolution here lets the prerenderer change independently
 * during a future v7 migration. This prototype is intentionally not wired
 * into the production prerenderer.
 */
export function resolveStaticRouter(serverModule: unknown): StaticRouterComponent {
  const module = (serverModule ?? {}) as ServerModule;
  const candidate = module.StaticRouter ?? module.default?.StaticRouter;

  if (!isStaticRouterComponent(candidate)) {
    throw new TypeError("SSR server module does not expose a usable StaticRouter export");
  }

  return candidate;
}

export function createStaticRouterElement(
  serverModule: unknown,
  location: string,
  children: ReactNode,
) {
  const StaticRouter = resolveStaticRouter(serverModule);
  return createElement(StaticRouter, { location }, children);
}
