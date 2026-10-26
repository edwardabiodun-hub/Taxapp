const DEFAULT_PUBLIC_SITE_ORIGIN = "https://www.filesmartnaija.com";

export const resolvePublicSiteOrigin = (configuredOrigin?: string) =>
  (configuredOrigin?.trim() || DEFAULT_PUBLIC_SITE_ORIGIN).replace(/\/+$/, "");
