import { prisma } from '@/lib/prisma';
import { generateJsonContent } from '@/lib/gemini/client';
import { geminiConfig } from '@/lib/gemini/config';
import { matchAnalysisSchema } from '@/lib/gemini/schemas';
import { buildMatchAnalysisPrompt } from '@/lib/gemini/prompts/match-analysis';
import { parsePreferences } from '@/lib/mappers';
import type { ComputeMatchPayload } from '@/types';

export async function computeMatchJob(payload: ComputeMatchPayload) {
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new Error('User not found');

  const prefs = parsePreferences(user.preferences);
  const jobs = await prisma.job.findMany({
    where: { id: { in: payload.jobIds }, isActive: true },
  });

  const results: Record<string, { matchScore: number; whyYouFit: string; topSkillGaps: string[] }> = {};

  for (const job of jobs.slice(0, 10)) {
    const analysis = await generateJsonContent({
      prompt: buildMatchAnalysisPrompt({
        skills: user.skills,
        parsedSummary: prefs.parsedSummary || '',
        targetRoles: user.targetRoles,
        role: job.role,
        companyName: job.companyName,
        requirements: job.requirements,
        tags: job.tags,
      }),
      schema: matchAnalysisSchema,
      model: geminiConfig.flashModel,
    });

    results[job.id] = {
      matchScore: analysis.matchScore,
      whyYouFit: analysis.whyYouFit,
      topSkillGaps: analysis.topSkillGaps,
    };

    // Cache on existing application if present
    await prisma.application.updateMany({
      where: { userId: payload.userId, jobId: job.id },
      data: {
        matchScore: analysis.matchScore,
        whyYouFit: analysis.whyYouFit,
      },
    });
  }

  return results;
}
