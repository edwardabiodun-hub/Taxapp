import { resolvePublicSiteOrigin } from "./public-site-origin";

export interface PageMetadata {
  title: string;
  description: string;
  path: string;
  type?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

type ElementSnapshot = {
  element: HTMLElement;
  parent: Node | null;
  nextSibling: ChildNode | null;
  attributes: Array<[string, string]>;
};

export const PUBLIC_SITE_ORIGIN = resolvePublicSiteOrigin(import.meta.env.VITE_PUBLIC_SITE_URL);

const getPageUrl = (path: string) => new URL(path, `${PUBLIC_SITE_ORIGIN}/`).toString();

export function setPageMetadata(metadata: PageMetadata): () => void {
  const previousTitle = document.title;
  const previousElements = new Map<string, ElementSnapshot | null>();
  const pageUrl = getPageUrl(metadata.path);

  const setElementAttribute = (
    selector: string,
    tagName: keyof HTMLElementTagNameMap,
    identityAttribute: string,
    identityValue: string,
    attribute: string,
    value: string,
  ) => {
    const existing = document.head.querySelector<HTMLElement>(selector);
    previousElements.set(
      selector,
      existing
        ? {
            element: existing,
            parent: existing.parentNode,
            nextSibling: existing.nextSibling,
            attributes: Array.from(existing.attributes, ({ name, value }) => [name, value]),
          }
        : null,
    );

    const element = existing ?? document.createElement(tagName);
    element.setAttribute(identityAttribute, identityValue);
    element.setAttribute(attribute, value);
    if (!existing) document.head.appendChild(element);
  };

  const setOptionalElementAttribute = (
    selector: string,
    tagName: keyof HTMLElementTagNameMap,
    identityAttribute: string,
    identityValue: string,
    attribute: string,
    value: string | undefined,
  ) => {
    const existing = document.head.querySelector<HTMLElement>(selector);
    previousElements.set(
      selector,
      existing
        ? {
            element: existing,
            parent: existing.parentNode,
            nextSibling: existing.nextSibling,
            attributes: Array.from(existing.attributes, ({ name, value }) => [name, value]),
          }
        : null,
    );

    if (value !== undefined) {
      const element = existing ?? document.createElement(tagName);
      element.setAttribute(identityAttribute, identityValue);
      element.setAttribute(attribute, value);
      if (!existing) document.head.appendChild(element);
    } else if (existing) {
      existing.remove();
    }
  };

  document.title = metadata.title;
  setElementAttribute('meta[name="description"]', "meta", "name", "description", "content", metadata.description);
  setElementAttribute('link[rel="canonical"]', "link", "rel", "canonical", "href", pageUrl);
  setElementAttribute('meta[property="og:title"]', "meta", "property", "og:title", "content", metadata.title);
  setElementAttribute('meta[property="og:description"]', "meta", "property", "og:description", "content", metadata.description);
  setElementAttribute('meta[property="og:type"]', "meta", "property", "og:type", "content", metadata.type ?? "website");
  setElementAttribute('meta[property="og:url"]', "meta", "property", "og:url", "content", pageUrl);
  setOptionalElementAttribute(
    'meta[property="article:published_time"]',
    "meta",
    "property",
    "article:published_time",
    "content",
    metadata.publishedTime,
  );
  setOptionalElementAttribute(
    'meta[property="article:modified_time"]',
    "meta",
    "property",
    "article:modified_time",
    "content",
    metadata.modifiedTime,
  );

  return () => {
    document.title = previousTitle;

    for (const [selector, snapshot] of previousElements) {
      const current = document.head.querySelector<HTMLElement>(selector);
      if (current) current.remove();
      if (snapshot) {
        const { element, parent, nextSibling, attributes } = snapshot;
        for (const { name } of Array.from(element.attributes)) element.removeAttribute(name);
        for (const [name, value] of attributes) element.setAttribute(name, value);
        if (parent) parent.insertBefore(element, nextSibling && nextSibling.parentNode === parent ? nextSibling : null);
      }
    }
  };
}
