import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { handleCorsPreflight, assertAllowedOrigin } from '@/lib/cors';
import { prisma } from '@/lib/prisma';
import { enqueue } from '@/lib/queue';
import { buildLookupJob } from '@/server/extension/lookup';
import { extensionError, extensionJson, unauthenticated } from '@/server/extension/http';

export const runtime = 'nodejs';

const bodySchema = z.object({ jobId: z.string().min(1) });

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req) ?? new Response(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;
  const forbidden = assertAllowedOrigin(req);
  if (forbidden) return forbidden;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return unauthenticated(req);

  const { jobId } = bodySchema.parse(await req.json());
  const job = await prisma.job.findFirst({ where: { id: jobId, isActive: true } });
  if (!job) return extensionError(req, 'JOB_NOT_FOUND', 'Job not found', 404);

  const application = await prisma.application.findFirst({
    where: { userId: session.user.id, jobId },
  });

  // Already has a Gemini score — reuse it, never recompute blindly.
  if (application?.matchScore != null) {
    const lookupJob = await buildLookupJob(session.user.id, job);
    return extensionJson(req, {
      ok: true,
      job: lookupJob,
      aiJobId: null,
      status: 'READY',
    });
  }

  const aiJob = await enqueue('compute-match', {
    userId: session.user.id,
    jobIds: [jobId],
  });

  return extensionJson(req, {
    ok: true,
    jobId,
    aiJobId: aiJob.id,
    status: 'GENERATING',
  });
}
