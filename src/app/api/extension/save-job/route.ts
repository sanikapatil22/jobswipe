import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { handleCorsPreflight, assertAllowedOrigin } from '@/lib/cors';
import { saveDetectedJob } from '@/server/extension/save-job';
import { extensionError, extensionJson, unauthenticated } from '@/server/extension/http';

export const runtime = 'nodejs';

const bodySchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  company: z.string().optional(),
  ats: z.enum(['greenhouse', 'lever']).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
});

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

  const data = bodySchema.parse(await req.json());

  try {
    const { job, aiJobId } = await saveDetectedJob(session.user.id, data);
    return extensionJson(req, {
      ok: true,
      job,
      aiJobId,
      message: 'Job added to SwipePrep.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save job';
    return extensionError(req, 'SAVE_FAILED', message, 500);
  }
}
