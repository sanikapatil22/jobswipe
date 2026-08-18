export function metaContent(doc: Document, selector: string): string | null {
  const el = doc.querySelector<HTMLMetaElement>(selector);
  const value = el?.content?.trim();
  return value ? value : null;
}

/** Collapses whitespace and strips common job-board suffixes from titles. */
export function cleanTitle(raw: string): string {
  const cleaned = raw
    .replace(/\s+/g, ' ')
    .replace(/\s*\|\s*Job Board\s*$/i, '')
    .replace(/\s*[-–—|]\s*(?:Jobs|Careers|Job Board|Greenhouse|Lever)\s*$/i, '')
    .trim();
  return cleaned;
}

interface JsonLdOrg {
  name?: string;
  url?: string;
}

interface JsonLdPosting {
  '@type'?: string | string[];
  title?: string;
  name?: string;
  description?: string;
  hiringOrganization?: JsonLdOrg;
  url?: string;
  jobLocation?: { address?: { addressLocality?: string; addressRegion?: string; addressCountry?: string } } | string;
}

/** Extracts a JobPosting object from structured data, if present. */
export function jsonLdJobPosting(doc: Document): JsonLdPosting | null {
  const scripts = Array.from(doc.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'));
  for (const script of scripts) {
    let data: unknown;
    try {
      data = JSON.parse(script.textContent || '');
    } catch {
      continue;
    }
    const candidates = Array.isArray(data) ? data : [data];
    for (const candidate of candidates) {
      const node = candidate as JsonLdPosting;
      const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
      if (types.some((t) => t === 'JobPosting') && (node.title || node.name)) {
        return node;
      }
    }
  }
  return null;
}

/** Beautifies an ATS slug ("google") into a display name ("Google"). */
export function slugToName(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

/** Best-effort h1 for the job title, using visible page content. */
export function firstHeading(doc: Document, selectors: string[]): string | null {
  for (const selector of selectors) {
    const el = doc.querySelector<HTMLElement>(selector);
    const text = el?.innerText?.replace(/\s+/g, ' ').trim();
    if (text) return text;
  }
  return null;
}

/** Picks the most likely company from several signals. */
export function companyFrom(
  url: string,
  doc: Document,
  fallbackSlug?: string
): string | null {
  const siteName = metaContent(doc, 'meta[property="og:site_name"]');
  if (siteName) {
    const cleaned = cleanTitle(siteName)
      .replace(/\s*(?:Careers|Jobs|Job Board)\s*$/i, '')
      .trim();
    if (cleaned) return cleaned;
  }

  const ld = jsonLdJobPosting(doc);
  if (ld?.hiringOrganization?.name) return ld.hiringOrganization.name;

  if (fallbackSlug) return slugToName(fallbackSlug);

  try {
    const host = new URL(url).hostname.replace(/^www\./, '').split('.')[0];
    return slugToName(host);
  } catch {
    return null;
  }
}
