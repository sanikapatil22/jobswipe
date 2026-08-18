import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { handleCorsPreflight, assertAllowedOrigin } from '@/lib/cors';
import { prisma } from '@/lib/prisma';
import { parsePreferences } from '@/lib/mappers';
import { generateJsonContent } from '@/lib/gemini/client';
import { geminiConfig } from '@/lib/gemini/config';
import { buildTailorResumePrompt, tailoredResumeSchema } from '@/lib/gemini/prompts/tailor-resume';
import { extensionError, extensionJson, unauthenticated } from '@/server/extension/http';

export const runtime = 'nodejs';
export const maxDuration = 90;

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

  const [user, job] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.job.findUnique({ where: { id: jobId } }),
  ]);

  if (!user || !job) return extensionError(req, 'JOB_NOT_FOUND', 'Job not found', 404);

  const prefs = parsePreferences(user.preferences);
  const currentResume = prefs.rawResumeText || prefs.parsedSummary || '';

  if (!currentResume.trim()) {
    return extensionError(
      req,
      'NO_RESUME',
      'Upload and parse a resume in SwipePrep before tailoring.',
      409
    );
  }

  // Reuses the exact same Gemini workflow as the web app — no duplicated
  // prompt logic. Resume text stays on the server.
  const result = await generateJsonContent({
    prompt: buildTailorResumePrompt({
      companyName: job.companyName,
      role: job.title || job.role,
      jobDescription: job.descriptionHTML || job.description,
      jobRequirements: job.requirements,
      currentResume,
      skills: user.skills,
    }),
    schema: tailoredResumeSchema,
    model: geminiConfig.proModel,
    strictPrompt:
      'Return JSON with a "tailoredResume" string (full rewritten resume text), a "keywords" array of strings, and a "focusNotes" string.',
  });

  return extensionJson(req, {
    ok: true,
    jobId,
    tailoredResume: result.tailoredResume,
    keywords: result.keywords,
    focusNotes: result.focusNotes,
  });
}
