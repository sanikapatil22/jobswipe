import { prisma } from '@/lib/prisma';
import {
  computeHeuristicMatch,
  mapApplicationToClient,
  mapJobToClient,
  mapUserToProfile,
} from '@/lib/mappers';
import { enqueue } from '@/lib/queue';

export async function getJobsForUser(userId: string) {
  const [user, jobs, applications] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.job.findMany({
      where: { isActive: true },
      orderBy: { deadline: 'asc' },
    }),
    prisma.application.findMany({
      where: { userId },
      select: { jobId: true, matchScore: true, whyYouFit: true, status: true },
    }),
  ]);

  const appByJob = new Map(applications.map((a) => [a.jobId, a]));
  const appliedOrDiscarded = new Set(
    applications.filter((a) => a.status === 'APPLIED' || a.status === 'DISCARDED').map((a) => a.jobId)
  );

  const needsAiMatch: string[] = [];

  const mapped = jobs
    .filter((j) => !appliedOrDiscarded.has(j.id))
    .map((job) => {
      const existing = appByJob.get(job.id);
      const heuristic = computeHeuristicMatch(user.skills, job.tags, job.requirements);
      if (!existing?.matchScore) {
        needsAiMatch.push(job.id);
      }
      return mapJobToClient(job, {
        matchScore: existing?.matchScore ?? heuristic.matchScore,
        whyYouFit: existing?.whyYouFit ?? heuristic.whyYouFit,
        missingSkills: heuristic.missingSkills,
      });
    });

  // Enrich top-10 matches asynchronously (ARCHITECTURE.md §10)
  if (needsAiMatch.length > 0) {
    void enqueue('compute-match', {
      userId,
      jobIds: needsAiMatch.slice(0, 10),
    }).catch(() => undefined);
  }

  return mapped;
}

export async function getApplicationsForUser(userId: string) {
  const [user, applications] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.application.findMany({
      where: { userId, status: { not: 'DISCARDED' } },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return applications.map((a) => mapApplicationToClient(a, user.skills));
}

export async function getApplicationById(userId: string, applicationId: string) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId },
    include: { job: true },
  });
  if (!application) return null;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return mapApplicationToClient(application, user.skills);
}

export async function getProfileForUser(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return mapUserToProfile(user);
}
