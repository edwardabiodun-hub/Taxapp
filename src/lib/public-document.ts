import type { PublicRouteMetadata } from "./public-routes";

export interface PublicDocumentOptions {
  noIndex?: boolean;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function escapeJsonForHtml(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

function removeExistingMetadata(head: string): string {
  return head
    .replace(/\s*<title\b[^>]*>[\s\S]*?<\/title\s*>/gi, "")
    .replace(/\s*<meta\b(?=[^>]*\bname\s*=\s*["']description["'])[^>]*\/?>/gi, "")
    .replace(/\s*<meta\b(?=[^>]*\bname\s*=\s*["']robots["'])[^>]*\/?>/gi, "")
    .replace(/\s*<meta\b(?=[^>]*\bproperty\s*=\s*["']og:[^"']+["'])[^>]*\/?>/gi, "")
    .replace(/\s*<meta\b(?=[^>]*\bname\s*=\s*["']twitter:(?:title|description)["'])[^>]*\/?>/gi, "")
    .replace(/\s*<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*\/?>/gi, "")
    .replace(/\s*<script\b(?=[^>]*\btype\s*=\s*["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script\s*>/gi, "");
}

export function renderPublicDocument(
  template: string,
  renderedBody: string,
  metadata: PublicRouteMetadata,
  origin: string,
  options: PublicDocumentOptions = {},
): string {
  const canonicalUrl = new URL(metadata.path, `${origin.replace(/\/+$/, "")}/`).toString();
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: metadata.title,
    description: metadata.description,
    url: canonicalUrl,
  };
  const metadataTags = [
    `<title>${escapeHtml(metadata.title)}</title>`,
    `<meta name="description" content="${escapeHtml(metadata.description)}" />`,
    ...(options.noIndex ? ['<meta name="robots" content="noindex, nofollow" />'] : [`<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`]),
    `<meta property="og:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(metadata.description)}" />`,
    `<meta property="og:type" content="${metadata.type === "article" ? "article" : "website"}" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`,
    ...(metadata.publishedTime ? [`<meta property="article:published_time" content="${escapeHtml(metadata.publishedTime)}" />`] : []),
    ...(metadata.modifiedTime ? [`<meta property="article:modified_time" content="${escapeHtml(metadata.modifiedTime)}" />`] : []),
    ...(!options.noIndex ? [`<script type="application/ld+json">${escapeJsonForHtml(webPageSchema)}</script>`] : []),
  ].join("\n    ");

  const withHead = template.replace(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i, (_match, currentHead: string) => {
    return `<head>${removeExistingMetadata(currentHead)}\n    ${metadataTags}\n  </head>`;
  });

  return withHead.replace(/(<div\s+id="root"\s*>)[\s\S]*?(<\/div>)/i, (_match, openingTag: string, closingTag: string) => `${openingTag}${renderedBody}${closingTag}`);
}
