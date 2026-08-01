import { prisma } from '@/lib/prisma';
import type { NormalizedAtsJob } from '@/lib/ats/types';
import { buildCompanyBadgeDataUri, extractKeywords, extractListItems, htmlExcerpt, stripHtml, addDays } from '@/lib/jobs/job-utils';
import { computeHeuristicMatch, mapJobToClient } from '@/lib/mappers';
import type { Job } from '@/types';

function toPrismaAts(ats: NormalizedAtsJob['ats']) {
  return ats === 'greenhouse' ? 'GREENHOUSE' : 'LEVER';
}

export async function upsertSyncedJob(job: NormalizedAtsJob, sourceKey: string) {
  const description = stripHtml(job.descriptionHTML);
  const requirements = extractListItems(job.descriptionHTML, 6);
  const tags = extractKeywords(job.title, `${job.department || ''} ${description}`, 8);
  const companyLogo = buildCompanyBadgeDataUri(job.companyName);
  const firstPublished = job.firstPublished ?? job.updatedAtSource ?? new Date();
  const deadline = addDays(firstPublished, 21);

  return prisma.job.upsert({
    where: { sourceKey },
    create: {
      sourceKey,
      companyName: job.companyName,
      companySlug: job.companySlug,
      ats: toPrismaAts(job.ats),
      jobId: job.jobId,
      title: job.title,
      role: job.title,
      descriptionHTML: job.descriptionHTML,
      description: htmlExcerpt(job.descriptionHTML, 280),
      requirements,
      salary: 'Not disclosed',
      location: job.location,
      workType: job.location.toLowerCase().includes('remote') ? 'REMOTE' : 'ONSITE',
      companySize: job.companyName,
      firstPublished,
      updatedAtSource: job.updatedAtSource,
      rawResponse: job.rawResponse as object,
      applyUrl: job.applyUrl,
      tags,
      companyLogo,
      deadline,
      isActive: true,
    },
    update: {
      companyName: job.companyName,
      companySlug: job.companySlug,
      ats: toPrismaAts(job.ats),
      jobId: job.jobId,
      title: job.title,
      role: job.title,
      descriptionHTML: job.descriptionHTML,
      description: htmlExcerpt(job.descriptionHTML, 280),
      requirements,
      salary: 'Not disclosed',
      location: job.location,
      workType: job.location.toLowerCase().includes('remote') ? 'REMOTE' : 'ONSITE',
      companySize: job.companyName,
      firstPublished,
      updatedAtSource: job.updatedAtSource,
      rawResponse: job.rawResponse as object,
      applyUrl: job.applyUrl,
      tags,
      companyLogo,
      deadline,
      isActive: true,
    },
  });
}

export async function setInactiveJobsByCompany(companySlug: string, ats: string, activeSourceKeys: string[]) {
  const prismaAts = ats === 'greenhouse' ? 'GREENHOUSE' : 'LEVER';

  await prisma.job.updateMany({
    where: {
      companySlug,
      ats: prismaAts,
      sourceKey: { notIn: activeSourceKeys },
    },
    data: { isActive: false },
  });
}

export async function getJobsForDiscover(userId: string): Promise<Job[]> {
  const [user, jobs] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.job.findMany({
      where: { isActive: true },
      orderBy: [{ firstPublished: 'desc' }, { updatedAtSource: 'desc' }, { createdAt: 'desc' }],
    }),
  ]);

  return jobs.map((job) => {
    const heuristic = computeHeuristicMatch(user.skills, job.tags, job.requirements);
    return mapJobToClient(job, {
      matchScore: heuristic.matchScore,
      whyYouFit: heuristic.whyYouFit,
      missingSkills: heuristic.missingSkills,
    });
  });
}