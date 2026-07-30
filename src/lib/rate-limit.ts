import { prisma } from '@/lib/prisma';

const DEFAULT_LIMITS: Record<string, number> = {
  'parse-resume': Number(process.env.RATE_LIMIT_RESUME_PARSE || 10),
  'generate-roadmap': Number(process.env.RATE_LIMIT_ROADMAP || 20),
  'compute-match': 50,
};

/**
 * Per-user daily caps enforced before enqueueing AI work.
 */
export async function checkAndIncrementRateLimit(userId: string, action: string) {
  const limit = DEFAULT_LIMITS[action] ?? 20;
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);

  const existing = await prisma.rateLimitCounter.findUnique({
    where: { userId_action: { userId, action } },
  });

  if (!existing || existing.windowStart < dayStart) {
    await prisma.rateLimitCounter.upsert({
      where: { userId_action: { userId, action } },
      create: { userId, action, count: 1, windowStart: dayStart },
      update: { count: 1, windowStart: dayStart },
    });
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await prisma.rateLimitCounter.update({
    where: { userId_action: { userId, action } },
    data: { count: { increment: 1 } },
  });

  return { allowed: true, remaining: limit - existing.count - 1 };
}
