import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { enqueue } from '@/lib/queue';
import { buildCompanyBadgeDataUri, addDays, stripHtml } from '@/lib/jobs/job-utils';
import { COMPANY_REGISTRY } from '@/lib/jobs/company-registry';
import { greenhouseAdapter } from '@/lib/ats/greenhouse';
import { leverAdapter } from '@/lib/ats/lever';
import { upsertSyncedJob } from '@/server/repositories/job-repository';
import {
  buildSourceKey,
  buildLookupJob,
  findMatchingJob,
  parseAtsUrl,
  type DetectedJob,
  type LookupJob,
} from './lookup';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function hashUrl(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 24);
}

/** Fetches real posting detail from the ATS when the URL is parseable. */
async function tryFetchAtsDetail(detected: DetectedJob) {
  const parse = parseAtsUrl(detected.url);
  if (!parse) return null;

  try {
    const registryEntry =
      COMPANY_REGISTRY.find((company) => company.slug === parse.slug) ?? {
        name: detected.company || parse.slug,
        ats: parse.ats,
        slug: parse.slug,
      };

    const adapter = parse.ats === 'greenhouse' ? greenhouseAdapter : leverAdapter;
    const detail = await adapter.fetchJobDetail(registryEntry, {
      jobId: parse.jobId,
      title: detected.title || '',
      location: detected.location || '',
      applyUrl: detected.url,
      firstPublished: null,
      updatedAt: null,
      rawResponse: null,
    });

    return {
      sourceKey: buildSourceKey(parse),
      detail,
    };
  } catch (error) {
    // Fall back to a minimal row rather than failing the whole save.
    console.warn('ATS detail fetch failed, saving minimal job', detected.url, error);
    return null;
  }
}

/**
 * Ensures the detected job exists in SwipePrep and creates the user's
 * Application (SAVED), then enqueues the existing Gemini `compute-match`
 * background job so a real AI match score is generated asynchronously.
 */
export async function saveDetectedJob(
  userId: string,
  detected: DetectedJob
): Promise<{ job: LookupJob; aiJobId: string | null }> {
  let job = await findMatchingJob(detected);

  if (!job) {
    const atsDetail = await tryFetchAtsDetail(detected);

    if (atsDetail) {
      job = await upsertSyncedJob(atsDetail.detail, atsDetail.sourceKey);
    } else {
      const url = detected.url.trim();
      const title = (detected.title || 'Open Role').trim();
      const company = (detected.company || new URL(url).hostname).trim();
      const sourceKey = `ext:${hashUrl(url)}`;
      const now = new Date();
      const description = stripHtml(detected.description || '');
      const location = detected.location || '';

      job = await prisma.job.upsert({
        where: { sourceKey },
        create: {
          sourceKey,
          companyName: company,
          companySlug: slugify(company),
          ats: detected.ats ? detected.ats.toUpperCase() as 'GREENHOUSE' | 'LEVER' : 'GREENHOUSE',
          jobId: hashUrl(url),
          title,
          role: title,
          descriptionHTML: detected.description || '',
          description,
          requirements: [],
          salary: 'Not disclosed',
          location,
          workType: location.toLowerCase().includes('remote') ? 'REMOTE' : 'ONSITE',
          companySize: company,
          firstPublished: now,
          updatedAtSource: now,
          rawResponse: {},
          applyUrl: url,
          tags: [],
          companyLogo: buildCompanyBadgeDataUri(company),
          deadline: addDays(now, 21),
          isActive: true,
        },
        update: {},
      });
    }
  }

  await prisma.application.upsert({
    where: { userId_jobId: { userId, jobId: job.id } },
    create: { userId, jobId: job.id, status: 'SAVED', roadmapStatus: 'PENDING' },
    update: { status: 'SAVED' },
  });

  // Reuse the existing Gemini background job for a real match score.
  const aiJob = await enqueue('compute-match', {
    userId,
    jobIds: [job.id],
  });

  const lookupJob = await buildLookupJob(userId, job);
  return { job: lookupJob!, aiJobId: aiJob.id };
}
