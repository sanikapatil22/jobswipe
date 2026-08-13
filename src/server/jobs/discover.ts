import { prisma } from '@/lib/prisma';
import { computeHeuristicMatch, mapJobToClient } from '@/lib/mappers';
import { jobMatchesFilters, hasSkill, BASE_SKILLS, type DiscoverFacets, type DiscoverFilters } from '@/lib/jobs/filters';
import type { Job } from '@/types';

export const DISCOVER_PAGE_SIZE = 20;
const OVERFETCH = 5; // fetch extra raw rows so post-filter pages stay dense

export interface DiscoverPageResult {
  jobs: Job[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function getDiscoverFacets(): Promise<DiscoverFacets> {
  const [locations, companies, jobTexts] = await Promise.all([
    prisma.job.findMany({
      where: { isActive: true },
      select: { location: true },
      distinct: ['location'],
    }),
    prisma.job.findMany({
      where: { isActive: true },
      select: { companyName: true },
      distinct: ['companyName'],
      orderBy: { companyName: 'asc' },
    }),
    prisma.job.findMany({
      where: { isActive: true },
      select: { description: true, requirements: true, tags: true },
    }),
  ]);

  const skills = BASE_SKILLS.map((name) => {
    let count = 0;
    for (const j of jobTexts) {
      const text = `${j.description} ${(j.requirements || []).join(' ')} ${(j.tags || []).join(' ')}`;
      const fake = {
        description: text,
        requirements: j.requirements,
        tags: j.tags,
      } as unknown as Job;
      if (hasSkill(fake, name)) count++;
    }
    return { name, count };
  }).sort((a, b) => b.count - a.count);

  return {
    locations: locations.map((l) => l.location).sort(),
    companies: companies.map((c) => c.companyName),
    skills,
  };
}

/**
 * Server-side discover feed. Fetches active jobs, computes the user's
 * heuristic match, applies the filters, personalizes the order (best match
 * first) and cursor-paginates. Filtering happens on the server; the engine is
 * structured so the DB `where` clause can take over when the dataset grows.
 */
export async function fetchDiscoverPage(
  userId: string,
  filters: DiscoverFilters,
  options: { cursor?: string | null; limit?: number } = {}
): Promise<DiscoverPageResult> {
  const limit = options.limit ?? DISCOVER_PAGE_SIZE;

  const [user, rawJobs] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.job.findMany({
      where: { isActive: true },
      orderBy: [{ firstPublished: 'desc' }, { id: 'desc' }],
    }),
  ]);

  const matched: Job[] = [];
  for (const job of rawJobs) {
    const heuristic = computeHeuristicMatch(user.skills, job.tags, job.requirements);
    const clientJob = mapJobToClient(job, {
      matchScore: heuristic.matchScore,
      whyYouFit: heuristic.whyYouFit,
      missingSkills: heuristic.missingSkills,
    });
    if (jobMatchesFilters(clientJob, filters)) {
      matched.push(clientJob);
    }
  }

  // Personalized ordering: strongest match first, then newest.
  matched.sort(
    (a, b) =>
      (b.staticMatchScore ?? 0) - (a.staticMatchScore ?? 0) ||
      new Date(b.postedDate || 0).getTime() - new Date(a.postedDate || 0).getTime()
  );

  // Cursor pagination over the filtered set (stable id-based cursor).
  const startIndex = options.cursor
    ? matched.findIndex((j) => j.id === options.cursor) + 1
    : 0;

  if (options.cursor && startIndex === 0) {
    // Cursor no longer present (filters changed) — restart from the top.
    const page = matched.slice(0, limit);
    return {
      jobs: page,
      nextCursor: matched.length > limit ? page[page.length - 1]?.id ?? null : null,
      hasMore: matched.length > limit,
    };
  }

  const slice = matched.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < matched.length;
  const nextCursor = hasMore ? slice[slice.length - 1]?.id ?? null : null;

  return { jobs: slice, nextCursor, hasMore };
}

/** Overfetch-friendly paged fetch (unused today, kept for future DB-side filters). */
export const OVERFETCH_FACTOR = OVERFETCH;
