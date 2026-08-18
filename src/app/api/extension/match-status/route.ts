import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { handleCorsPreflight, assertAllowedOrigin } from '@/lib/cors';
import { prisma } from '@/lib/prisma';
import { extensionError, extensionJson, unauthenticated } from '@/server/extension/http';

export const runtime = 'nodejs';

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req) ?? new Response(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;
  const forbidden = assertAllowedOrigin(req);
  if (forbidden) return forbidden;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return unauthenticated(req);

  const aiJobId = req.nextUrl.searchParams.get('aiJobId');
  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!aiJobId || !jobId) {
    return extensionError(req, 'MISSING_PARAMS', 'aiJobId and jobId are required');
  }

  const aiJob = await prisma.aiJob.findFirst({
    where: { id: aiJobId, userId: session.user.id },
  });
  if (!aiJob) return extensionError(req, 'JOB_NOT_FOUND', 'Match job not found', 404);

  if (aiJob.status !== 'COMPLETED') {
    return extensionJson(req, {
      ok: true,
      status: aiJob.status,
      error: aiJob.error,
    });
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  const application = await prisma.application.findFirst({
    where: { userId: session.user.id, jobId },
  });

  const matchScore = application?.matchScore ?? null;
  const whyYouFit = application?.whyYouFit ?? null;

  return extensionJson(req, {
    ok: true,
    status: 'COMPLETED',
    matchScore,
    whyYouFit,
    source: matchScore != null ? 'gemini' : null,
    jobCompany: job?.companyName ?? null,
    jobTitle: job?.title ?? null,
  });
}
