import { prisma } from '@/lib/prisma';
import { generateJsonContent } from '@/lib/gemini/client';
import { geminiConfig } from '@/lib/gemini/config';
import { companyInsightsSchema } from '@/lib/gemini/schemas';
import {
  buildCompanyInsightsPrompt,
  buildStrictCompanyInsightsPrompt,
} from '@/lib/gemini/prompts/company-insights';
import type { GenerateInsightsPayload } from '@/types';

export async function generateInsightsJob(payload: GenerateInsightsPayload) {
  const application = await prisma.application.findFirst({
    where: { id: payload.applicationId, userId: payload.userId },
    include: { job: true, user: true },
  });

  if (!application) {
    throw new Error('Application not found');
  }

  await prisma.application.update({
    where: { id: application.id },
    data: { insightsStatus: 'GENERATING' },
  });

  try {
    const input = {
      companyName: application.job.companyName,
      role: application.job.role,
      description: application.job.description || application.job.descriptionHTML || '',
      requirements: application.job.requirements,
      userSkills: application.user.skills,
    };

    let insights;
    try {
      insights = await generateJsonContent({
        prompt: buildCompanyInsightsPrompt(input),
        strictPrompt: buildStrictCompanyInsightsPrompt(input),
        schema: companyInsightsSchema,
        model: geminiConfig.flashModel,
      });
    } catch {
      insights = await generateJsonContent({
        prompt: buildStrictCompanyInsightsPrompt(input),
        schema: companyInsightsSchema,
        model: geminiConfig.proModel,
      });
    }

    await prisma.application.update({
      where: { id: application.id },
      data: {
        insights,
        insightsStatus: 'READY',
      },
    });

    return insights;
  } catch (error) {
    await prisma.application.update({
      where: { id: application.id },
      data: { insightsStatus: 'FAILED' },
    });
    throw error;
  }
}
