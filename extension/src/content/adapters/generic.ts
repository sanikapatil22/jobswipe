import type { DetectedJob } from '../../types';
import {
  cleanTitle,
  companyFrom,
  firstHeading,
  jsonLdJobPosting,
  metaContent,
  slugToName,
} from './dom';

const JOB_PATH_HINTS = /(?:jobs?|careers?|positions?|openings?|job-application|apply)\b/i;
const JOB_TITLE_HINTS = /(?:engineer|developer|intern|analyst|designer|scientist|manager|associate|specialist|consultant|architect|product\s+manager)/i;

/**
 * Generic fallback for normal HTML application forms. Deliberately
 * conservative: only reports a job when several independent signals agree,
 * so we never surface a match for an arbitrary webpage.
 */
export function detectGeneric(url: string, doc: Document): DetectedJob | null {
  const ld = jsonLdJobPosting(doc);
  const ogTitle = metaContent(doc, 'meta[property="og:title"]');
  const docTitle = doc.title;
  const heading = firstHeading(doc, ['h1']);

  const candidates = [ogTitle, docTitle, heading].filter(Boolean) as string[];
  const looksLikeJobPage =
    JOB_PATH_HINTS.test(new URL(url).pathname) || JOB_TITLE_HINTS.test(candidates.join(' '));

  if (!looksLikeJobPage) return null;

  // Strongest: structured data.
  if (ld) {
    const title = cleanTitle(ld.title || ld.name || '');
    const company =
      ld.hiringOrganization?.name?.trim() ||
      companyFrom(url, doc) ||
      slugToName(new URL(url).hostname.split('.')[0]);
    if (title) {
      return {
        url,
        title,
        company,
        description: (ld.description || '').slice(0, 600) || undefined,
        confidence: 0.85,
      };
    }
  }

  // Fallback: og:title split on a company separator.
  const splitTitle = (raw: string) => cleanTitle(raw).split(/\s*[-–—|]\s*/)[0]?.trim() ?? '';
  const title = (ogTitle && splitTitle(ogTitle)) || splitTitle(docTitle);
  if (!title || !JOB_TITLE_HINTS.test(title)) return null;

  const company =
    companyFrom(url, doc) || slugToName(new URL(url).hostname.split('.')[0]);

  return {
    url,
    title,
    company,
    confidence: 0.6,
  };
}
