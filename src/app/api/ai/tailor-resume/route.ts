import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { corsHeaders, handleCorsPreflight, assertAllowedOrigin } from '@/lib/cors';
import { generateJsonContent } from '@/lib/gemini/client';
import { geminiConfig } from '@/lib/gemini/config';
import { buildTailorResumePrompt, tailoredResumeSchema } from '@/lib/gemini/prompts/tailor-resume';

export const runtime = 'nodejs';
export const maxDuration = 90;

const bodySchema = z.object({
  companyName: z.string(),
  role: z.string(),
  jobDescription: z.string().default(''),
  jobRequirements: z.array(z.string()).default([]),
  currentResume: z.string().min(1),
  skills: z.array(z.string()).default([]),
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
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders(req),
    });
  }

  const data = bodySchema.parse(await req.json());

  const result = await generateJsonContent({
    prompt: buildTailorResumePrompt(data),
    schema: tailoredResumeSchema,
    model: geminiConfig.proModel,
    strictPrompt:
      'Return JSON with a "tailoredResume" string (full rewritten resume text), a "keywords" array of strings, and a "focusNotes" string.',
  });

  return Response.json(result, { headers: corsHeaders(req) });
}
