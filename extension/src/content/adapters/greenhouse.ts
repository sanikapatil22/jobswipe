import type { DetectedJob } from '../../types';
import {
  cleanTitle,
  companyFrom,
  firstHeading,
  jsonLdJobPosting,
  metaContent,
} from './dom';

const GREENHOUSE_HOSTS = new Set(['boards.greenhouse.io', 'job-boards.greenhouse.io']);

export function isGreenhouseUrl(url: string): boolean {
  try {
    return GREENHOUSE_HOSTS.has(new URL(url).hostname.replace(/^www\./, '').toLowerCase());
  } catch {
    return false;
  }
}

export function detectGreenhouse(url: string, doc: Document): DetectedJob | null {
  if (!isGreenhouseUrl(url)) return null;

  let slug: string | null = null;
  try {
    slug = new URL(url).pathname.split('/').filter(Boolean)[0] ?? null;
  } catch {
    slug = null;
  }

  const ogTitle = metaContent(doc, 'meta[property="og:title"]');
  const title =
    cleanTitle(firstHeading(doc, ['h1.app-title', '#header h1', 'h1']) ?? '') ||
    (ogTitle ? cleanTitle(ogTitle.split(' - ')[0]) : '') ||
    cleanTitle(doc.title.split(' - ')[0] || doc.title);

  const company =
    companyFrom(url, doc, slug ?? undefined) ??
    (slug ? slug[0].toUpperCase() + slug.slice(1) : null);

  if (!title) return null;

  return {
    url,
    title,
    company: company ?? undefined,
    ats: 'greenhouse',
    confidence: 0.95,
  };
}
