import { prisma } from '@/lib/prisma';
import { generateJsonContent } from '@/lib/gemini/client';
import { geminiConfig } from '@/lib/gemini/config';
import { roadmapSchema } from '@/lib/gemini/schemas';
import { buildRoadmapPrompt, buildStrictRoadmapPrompt } from '@/lib/gemini/prompts/roadmap';
import type { GenerateRoadmapPayload } from '@/types';

export async function generateRoadmapJob(payload: GenerateRoadmapPayload) {
  const application = await prisma.application.findFirst({
    where: { id: payload.applicationId, userId: payload.userId },
    include: { job: true, user: true },
  });

  if (!application) {
    throw new Error('Application not found');
  }

  await prisma.application.update({
    where: { id: application.id },
    data: { roadmapStatus: 'GENERATING' },
  });

  try {
    const input = {
      companyName: application.job.companyName,
      role: application.job.role,
      description: application.job.description,
      requirements: application.job.requirements,
      userSkills: application.user.skills,
    };

    let roadmap;
    try {
      roadmap = await generateJsonContent({
        prompt: buildRoadmapPrompt(input),
        strictPrompt: buildStrictRoadmapPrompt(input),
        schema: roadmapSchema,
        model: geminiConfig.flashModel,
      });
    } catch {
      roadmap = await generateJsonContent({
        prompt: buildStrictRoadmapPrompt(input),
        schema: roadmapSchema,
        model: geminiConfig.proModel,
      });
    }

    await prisma.application.update({
      where: { id: application.id },
      data: {
        roadmap,
        roadmapStatus: 'READY',
      },
    });

    return roadmap;
  } catch (error) {
    await prisma.application.update({
      where: { id: application.id },
      data: { roadmapStatus: 'FAILED' },
    });
    throw error;
  }
}
