import { prisma } from '@/lib/prisma';
import {
  mapApplicationToClient,
  mapUserToProfile,
} from '@/lib/mappers';
import { getJobsForDiscover } from '@/server/repositories/job-repository';

export async function getJobsForUser(userId: string) {
  return getJobsForDiscover(userId);
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
