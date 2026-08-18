import { prisma } from '@/lib/prisma';
import { computeHeuristicMatch } from '@/lib/mappers';
import type { Job as DbJob } from '@/generated/prisma/client';

/** Detected by the extension content script on the application page. */
export interface DetectedJob {
  url: string;
  title?: string;
  company?: string;
  ats?: 'greenhouse' | 'lever';
  description?: string;
  location?: string;
}

export interface AtsUrlParse {
  ats: 'greenhouse' | 'lever';
  slug: string;
  jobId: string;
}

/** Parses supported ATS job URLs into a stable source key. */
export function parseAtsUrl(url: string): AtsUrlParse | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    const path = parsed.pathname.split('/').filter(Boolean);

    if (host === 'boards.greenhouse.io' || host === 'job-boards.greenhouse.io') {
      // boards.greenhouse.io/{slug}/jobs/{jobId}
      const slug = path[0];
      const jobsIndex = path.indexOf('jobs');
      const jobId = jobsIndex !== -1 ? path[jobsIndex + 1] : undefined;
      if (slug && jobId) return { ats: 'greenhouse', slug, jobId };
    }

    if (host === 'jobs.lever.co' || host === 'apply.lever.co') {
      // jobs.lever.co/{slug}/{jobId}
      if (path.length >= 2) return { ats: 'lever', slug: path[0], jobId: path[1] };
    }

    return null;
  } catch {
    return null;
  }
}

export function buildSourceKey(parse: AtsUrlParse): string {
  return `${parse.ats}:${parse.slug}:${parse.jobId}`;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCompany(company: string): string {
  return company
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function tokenOverlap(a: string, b: string): number {
  const tokensA = new Set(normalizeTitle(a).split(' ').filter(Boolean));
  const tokensB = new Set(normalizeTitle(b).split(' ').filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  for (const token of tokensA) if (tokensB.has(token)) intersection++;
  return intersection / Math.min(tokensA.size, tokensB.size);
}

/**
 * Matches a detected job against the existing Job table. Matching is
 * deliberately conservative — tiers in priority order, and we never return a
 * weak company-only guess:
 *   1. exact ATS source key (greenhouse:slug:jobId / lever:slug:jobId)
 *   2. exact apply URL
 *   3. same company (ATS slug or name) + identical normalized title
 *   4. same company + title token overlap >= 0.6
 */
export async function findMatchingJob(
  detected: DetectedJob
): Promise<DbJob | null> {
  const url = detected.url.trim();
  const parse = parseAtsUrl(url);
  const title = detected.title?.trim();
  const company = detected.company?.trim();

  // 1. Exact ATS source key
  if (parse) {
    const bySourceKey = await prisma.job.findMany({
      where: { sourceKey: buildSourceKey(parse), isActive: true },
      take: 1,
    });
    if (bySourceKey[0]) return bySourceKey[0];
  }

  // 2. Exact apply URL (normalized: scheme + host + path)
  try {
    const parsedUrl = new URL(url);
    const normalizedUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname.replace(/\/+$/, '')}`;
    const byUrl = await prisma.job.findMany({
      where: { applyUrl: { in: [url, normalizedUrl] }, isActive: true },
      take: 1,
    });
    if (byUrl[0]) return byUrl[0];
  } catch {
    // fall through to company/title matching
  }

  if (!title) return null;

  // 3 + 4. Same company (by ATS slug from the URL, or by detected company name)
  const sameCompany = await prisma.job.findMany({
    where: {
      isActive: true,
      OR: [
        ...(parse ? [{ companySlug: parse.slug }] : []),
        ...(company
          ? [{ companyName: { equals: company, mode: 'insensitive' as const } }]
          : []),
      ],
    },
    take: 200,
    orderBy: { firstPublished: 'desc' },
  });

  const exact = sameCompany.find(
    (job) => normalizeTitle(job.title) === normalizeTitle(title)
  );
  if (exact) return exact;

  let best: DbJob | null = null;
  let bestScore = 0;
  for (const job of sameCompany) {
    const score = tokenOverlap(job.title, title);
    if (score > bestScore) {
      bestScore = score;
      best = job;
    }
  }
  return best && bestScore >= 0.6 ? best : null;
}

/**
 * Builds the payload the extension is allowed to see. The match score reuses
 * SwipePrep's own scoring semantics — never invented here:
 *  - Gemini `Application.matchScore` when it exists (preferred)
 *  - otherwise the same heuristic used on the discover feed
 */
export async function buildLookupJob(
  userId: string,
  job: DbJob
): Promise<LookupJob | null> {
  const [user, application] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.application.findFirst({ where: { userId, jobId: job.id } }),
  ]);

  let matchScore: number | null = null;
  let matchSource: 'gemini' | 'heuristic' | null = null;
  let whyYouFit: string | null = null;

  if (application?.matchScore != null) {
    matchScore = application.matchScore;
    matchSource = 'gemini';
    whyYouFit = application.whyYouFit;
  } else {
    // Same heuristic the discover feed uses, seeded with the user's skills.
    const heuristic = computeHeuristicMatch(
      user?.skills ?? [],
      job.tags,
      job.requirements
    );
    matchScore = heuristic.matchScore;
    matchSource = 'heuristic';
    whyYouFit = heuristic.whyYouFit;
  }

  return {
    id: job.id,
    companyName: job.companyName,
    title: job.title || job.role,
    location: job.location,
    applyUrl: job.applyUrl,
    matchScore,
    matchSource,
    whyYouFit,
    saved: Boolean(application && application.status !== 'DISCARDED'),
    applicationId: application?.id ?? null,
  };
}

export interface LookupJob {
  id: string;
  companyName: string;
  title: string;
  location: string;
  applyUrl: string;
  matchScore: number | null;
  matchSource: 'gemini' | 'heuristic' | null;
  whyYouFit: string | null;
  saved: boolean;
  applicationId: string | null;
}
