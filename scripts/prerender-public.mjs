import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import { Route, Routes } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server.mjs";
import { createServer } from "vite";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.resolve(projectRoot, process.argv[2] ?? "dist-public");
const safeSupabaseUrl = "https://prerender.invalid";
const safeSupabaseAnonKey = "prerender-only-placeholder";

const pageModules = {
  "/": "/src/pages/Landing.tsx",
  "/learn": "/src/pages/Learn.tsx",
  "/how-it-works": "/src/pages/HowItWorks.tsx",
  "/about": "/src/pages/About.tsx",
  "/contact": "/src/pages/Contact.tsx",
  "/privacy": "/src/pages/Privacy.tsx",
  "/terms": "/src/pages/Terms.tsx",
  "/disclaimer": "/src/pages/Disclaimer.tsx",
  "/calculator": "/src/pages/TaxCalculator.tsx",
  "/filing-directory": "/src/pages/FilingDirectory.tsx",
  "/404": "/src/components/public/PublicNotFound.tsx",
};

const vite = await createServer({
  configFile: path.join(projectRoot, "vite.config.ts"),
  root: projectRoot,
  mode: "public",
  isProduction: true,
  appType: "custom",
  logLevel: "error",
  server: { middlewareMode: true, hmr: false },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(safeSupabaseUrl),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(safeSupabaseAnonKey),
  },
});

try {
  const [{ publicRouteMetadata, renderPublicSitemap }, { renderPublicDocument }] = await Promise.all([
    vite.ssrLoadModule("/src/lib/public-routes.ts"),
    vite.ssrLoadModule("/src/lib/public-document.ts"),
  ]);
  const { PUBLIC_SITE_ORIGIN: origin } = await vite.ssrLoadModule("/src/lib/seo.ts");
  const shell = await fs.readFile(path.join(outputDirectory, "index.html"), "utf8");
  const loadedPages = new Map();

  for (const [routePath, modulePath] of Object.entries(pageModules)) {
    loadedPages.set(routePath, (await vite.ssrLoadModule(modulePath)).default);
  }
  const Guide = (await vite.ssrLoadModule("/src/pages/Guide.tsx")).default;

  const renderRoute = (routePath, Page, matchPath = routePath) => {
    const pageRoute = h(Route, { path: matchPath, element: h(Page) });
    const tree = h(StaticRouter, { location: routePath }, h(Routes, null, pageRoute));
    return renderToString(tree);
  };

  const writeHtml = async (filePath, html) => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, html, "utf8");
  };

  for (const metadata of publicRouteMetadata) {
    const routePath = metadata.path;
    const isGuide = routePath.startsWith("/learn/");
    const Page = isGuide ? Guide : loadedPages.get(routePath);
    if (!Page) throw new Error(`No prerender component registered for public route: ${routePath}`);

    const markup = renderRoute(routePath, Page, isGuide ? "/learn/:slug" : routePath);
    const html = renderPublicDocument(shell, markup, metadata, origin);
    const outputPath = routePath === "/"
      ? path.join(outputDirectory, "index.html")
      : path.join(outputDirectory, routePath.slice(1), "index.html");
    await writeHtml(outputPath, html);
  }

  const notFoundMetadata = { title: "Page not found | FileSmart", description: "The page could not be found.", path: "/404" };
  const notFoundMarkup = renderRoute("/404", loadedPages.get("/404"));
  await writeHtml(
    path.join(outputDirectory, "404.html"),
    renderPublicDocument(shell, notFoundMarkup, notFoundMetadata, origin, { noIndex: true }),
  );
  await fs.writeFile(path.join(outputDirectory, "sitemap.xml"), renderPublicSitemap(origin), "utf8");

  console.log(`Prerendered ${publicRouteMetadata.length} public routes and a 404 page.`);
} finally {
  await vite.close();
}
