import type { DetectedJob } from '../../types';
import {
  cleanTitle,
  companyFrom,
  firstHeading,
  metaContent,
} from './dom';

const LEVER_HOSTS = new Set(['jobs.lever.co', 'apply.lever.co']);

export function isLeverUrl(url: string): boolean {
  try {
    return LEVER_HOSTS.has(new URL(url).hostname.replace(/^www\./, '').toLowerCase());
  } catch {
    return false;
  }
}

export function detectLever(url: string, doc: Document): DetectedJob | null {
  if (!isLeverUrl(url)) return null;

  let slug: string | null = null;
  try {
    slug = new URL(url).pathname.split('/').filter(Boolean)[0] ?? null;
  } catch {
    slug = null;
  }

  const ogTitle = metaContent(doc, 'meta[property="og:title"]');

  // Lever titles look like "Software Engineer Intern — Google" or "Title | Company".
  const splitTitle = (raw: string) => cleanTitle(raw).split(/\s*[-–—|]\s*/)[0]?.trim() ?? '';

  const title =
    cleanTitle(firstHeading(doc, ['h1.posting-title', 'h1']) ?? '') ||
    (ogTitle ? splitTitle(ogTitle) : '') ||
    splitTitle(doc.title);

  const company =
    companyFrom(url, doc, slug ?? undefined) ??
    (slug ? slug[0].toUpperCase() + slug.slice(1) : null);

  if (!title) return null;

  return {
    url,
    title,
    company: company ?? undefined,
    ats: 'lever',
    confidence: 0.95,
  };
}
