import { prisma } from '@/lib/prisma';
import { generateJsonContent } from '@/lib/gemini/client';
import { geminiConfig } from '@/lib/gemini/config';
import { resumeParseSchema } from '@/lib/gemini/schemas';
import {
  buildResumeParsePrompt,
  buildStrictResumeParsePrompt,
} from '@/lib/gemini/prompts/resume-parse';
import { sanitizePromptInput } from '@/lib/gemini/sanitize';
import { parsePreferences } from '@/lib/mappers';
import type { ParseResumePayload } from '@/types';

async function extractTextFromPdfUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download resume PDF (${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > 5 * 1024 * 1024) {
    throw new Error('Resume PDF exceeds 5MB size limit');
  }
  const pdfParseMod = await import('pdf-parse');
  const pdfParse =
    typeof pdfParseMod === 'function'
      ? pdfParseMod
      : ((pdfParseMod as { default?: (buf: Buffer) => Promise<{ text: string }> }).default ??
        (pdfParseMod as unknown as (buf: Buffer) => Promise<{ text: string }>));
  const data = await pdfParse(buffer);
  return sanitizePromptInput(data.text || '', 50000);
}

export async function parseResumeJob(payload: ParseResumePayload) {
  let resumeText = payload.resumeText || '';

  if (!resumeText && payload.resumeUrl) {
    resumeText = await extractTextFromPdfUrl(payload.resumeUrl);
  }

  if (!resumeText.trim()) {
    throw new Error('Resume text is required');
  }

  const result = await generateJsonContent({
    prompt: buildResumeParsePrompt(resumeText),
    strictPrompt: buildStrictResumeParsePrompt(resumeText),
    schema: resumeParseSchema,
    model: geminiConfig.flashModel,
  });

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new Error('User not found');

  const prefs = parsePreferences(user.preferences);

  await prisma.user.update({
    where: { id: payload.userId },
    data: {
      name: result.name || user.name,
      atsScore: result.atsScore,
      skills: result.skills,
      targetRoles: result.targetRoles,
      resumeUrl: payload.resumeUrl ?? user.resumeUrl,
      preferences: {
        ...prefs,
        university: result.university || prefs.university,
        graduationYear: result.graduationYear || prefs.graduationYear,
        gpa: result.gpa || prefs.gpa,
        experiences: result.experiences.length ? result.experiences : prefs.experiences,
        rawResumeText: resumeText,
        parsedSummary: result.parsedSummary,
      } as object,
    },
  });

  return result;
}
