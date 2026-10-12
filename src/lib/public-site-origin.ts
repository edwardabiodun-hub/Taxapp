const DEFAULT_PUBLIC_SITE_ORIGIN = "https://filesmart-demo.netlify.app";

export const resolvePublicSiteOrigin = (configuredOrigin?: string) =>
  (configuredOrigin?.trim() || DEFAULT_PUBLIC_SITE_ORIGIN).replace(/\/+$/, "");
