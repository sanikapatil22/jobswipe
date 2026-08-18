import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { handleCorsPreflight, assertAllowedOrigin } from '@/lib/cors';
import {
  buildLookupJob,
  findMatchingJob,
  type DetectedJob,
} from '@/server/extension/lookup';
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
  const detected: DetectedJob = data;

  const job = await findMatchingJob(detected);

  if (!job) {
    return extensionJson(req, {
      ok: true,
      matched: false,
      job: null,
      detected: {
        url: detected.url,
        title: detected.title ?? null,
        company: detected.company ?? null,
        ats: detected.ats ?? null,
      },
    });
  }

  const lookupJob = await buildLookupJob(session.user.id, job);

  return extensionJson(req, {
    ok: true,
    matched: true,
    job: lookupJob,
    detected: {
      url: detected.url,
      title: detected.title ?? null,
      company: detected.company ?? null,
      ats: detected.ats ?? null,
    },
  });
}
