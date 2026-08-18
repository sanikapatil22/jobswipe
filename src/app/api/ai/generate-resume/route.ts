import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { generateJsonContent } from '@/lib/gemini/client';
import { geminiConfig } from '@/lib/gemini/config';

export const runtime = 'nodejs';
export const maxDuration = 60;

const bodySchema = z.object({
  name: z.string().default(''),
  email: z.string().default(''),
  university: z.string().default(''),
  graduationYear: z.string().default(''),
  gpa: z.string().default(''),
  skills: z.array(z.string()).default([]),
  experiences: z
    .array(
      z.object({
        company: z.string(),
        role: z.string(),
        duration: z.string(),
        bullets: z.array(z.string()),
      })
    )
    .default([]),
  projects: z.array(z.string()).default([]),
  targetRoles: z.array(z.string()).default([]),
});

const resumeSchema = z.object({
  resume: z.string(),
  tips: z.array(z.string()),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const data = bodySchema.parse(await req.json());

  const experiencesBlock = data.experiences
    .map(
      (e) =>
        `- ${e.role} at ${e.company} (${e.duration})\n${e.bullets
          .map((b) => `  - ${b}`)
          .join('\n')}`
    )
    .join('\n');

  const prompt = `Build a polished, ATS-friendly resume for this student. Use ONLY the facts provided — never invent companies, degrees, dates, or skills.

CONTACT
Name: ${data.name || '(student name)'}
Email: ${data.email || '(email)'}

EDUCATION
University: ${data.university || '(university)'}
Graduation: ${data.graduationYear || '(year)'}
GPA: ${data.gpa || 'N/A'}

TARGET ROLES: ${data.targetRoles.join(', ') || 'software engineering roles'}

SKILLS: ${data.skills.join(', ') || '(add skills)'}

EXPERIENCE:
${experiencesBlock || '- No experience entries provided yet.'}

PROJECTS:
${data.projects.map((p) => `- ${p}`).join('\n') || '- No projects provided yet.'}

Write the resume as plain text (no markdown headers like # or ## — use plain ALL-CAPS section headings). Structure:
- Contact line (name, email, location if known)
- EDUCATION
- TECHNICAL SKILLS (grouped: Languages / Frameworks & Tools / AI & Cloud)
- EXPERIENCE (strong action-verb bullets with measurable impact where the facts support it)
- PROJECTS
- (optional) ACHIEVEMENTS / EXTRACURRICULARS if facts exist — otherwise omit

Keep it to one page, use strong action verbs, quantify wherever the given facts allow, and never fabricate. Also return 3 short, specific tips to improve this resume.`;

  const result = await generateJsonContent({
    prompt,
    schema: resumeSchema,
    model: geminiConfig.proModel,
    strictPrompt:
      'Return JSON with a "resume" string containing the full resume text and a "tips" array of 3 strings.',
  });

  return Response.json(result);
}
