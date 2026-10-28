import { taxGuides } from "@/content/tax-guides";

export interface PublicRouteMetadata {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
}

export interface PublicSitemapEntry {
  path: string;
  lastModified?: string;
}

const staticPublicRoutes: PublicRouteMetadata[] = [
  {
    title: "FileSmart | Simple Nigerian tax preparation",
    description: "Prepare your Nigerian personal income tax information with a clear, guided online experience.",
    path: "/",
  },
  {
    title: "Learn about Nigerian tax | FileSmart",
    description: "Plain-language Nigerian tax education guides for understanding preparation and filing.",
    path: "/learn",
  },
  {
    title: "How FileSmart works | FileSmart",
    description: "See how FileSmart guides individuals in Nigeria through personal income tax preparation, step by step.",
    path: "/how-it-works",
  },
  {
    title: "About FileSmart | Nigerian tax preparation",
    description: "Learn why FileSmart is building a calmer, clearer tax preparation experience for people filing in Nigeria.",
    path: "/about",
  },
  {
    title: "Contact FileSmart | FileSmart",
    description: "Find support for FileSmart tax preparation questions.",
    path: "/contact",
  },
  {
    title: "Privacy policy | FileSmart",
    description: "Read the FileSmart draft privacy notice for its Nigerian tax preparation and education experience.",
    path: "/privacy",
  },
  {
    title: "Terms of use | FileSmart",
    description: "Review the FileSmart draft terms for using its Nigerian tax preparation and education experience.",
    path: "/terms",
  },
  {
    title: "Disclaimer | FileSmart",
    description: "Understand the educational scope and limitations of FileSmart tax preparation information.",
    path: "/disclaimer",
  },
  {
    title: "Personal income tax estimator | FileSmart",
    description: "Estimate your 2026 personal income tax using the Nigeria Tax Act 2025. The estimator does not submit a tax return.",
    path: "/calculator",
  },
  {
    title: "State filing directory | FileSmart",
    description: "Check the evidence status for online tax services and individual PIT filing routes across Nigeria.",
    path: "/filing-directory",
  },
];

export const publicRouteMetadata: PublicRouteMetadata[] = [
  ...staticPublicRoutes,
  ...taxGuides.map((guide) => ({
    title: `${guide.title} | FileSmart`,
    description: guide.summary,
    path: `/learn/${guide.slug}`,
    type: "article" as const,
    publishedTime: guide.publishedAt,
    modifiedTime: guide.updatedAt,
  })),
];

const routeMetadataByPath = new Map(publicRouteMetadata.map((route) => [route.path, route]));

export function getPublicRouteMetadata(path: string): PublicRouteMetadata | undefined {
  return routeMetadataByPath.get(path);
}

export function getPublicSitemapEntries(): PublicSitemapEntry[] {
  return publicRouteMetadata.map(({ path, modifiedTime }) => ({ path, lastModified: modifiedTime }));
}

function escapeXml(value: string): string {
  const entities: Record<string, string> = {
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  };
  return value.replace(/[<>&'"]/g, (character) => entities[character] ?? character);
}

export function renderPublicSitemap(origin: string): string {
  const normalizedOrigin = origin.replace(/\/+$/, "");
  const urls = getPublicSitemapEntries().map(({ path, lastModified }) => {
    const lastmod = lastModified ? `\n    <lastmod>${escapeXml(lastModified)}</lastmod>` : "";
    return `  <url>\n    <loc>${escapeXml(`${normalizedOrigin}${path === "/" ? "/" : path}`)}</loc>${lastmod}\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}
