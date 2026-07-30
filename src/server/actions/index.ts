'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { enqueue } from '@/lib/queue';
import { checkAndIncrementRateLimit } from '@/lib/rate-limit';
import { mapApplicationToClient, parsePreferences } from '@/lib/mappers';
import { roadmapSchema } from '@/lib/gemini/schemas';
import type { ApplicationStatus, UserProfile } from '@/types';

const swipeSchema = z.object({
  jobId: z.string().min(1),
  direction: z.enum(['left', 'right', 'save']),
  generateRoadmap: z.boolean().optional().default(true),
});

// Input type before Zod defaults are applied
type SwipeInput = {
  jobId: string;
  direction: 'left' | 'right' | 'save';
  generateRoadmap?: boolean;
};

const statusSchema = z.object({
  jobId: z.string().min(1),
  status: z.enum(['SAVED', 'DISCARDED', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED']),
  notes: z.string().optional(),
});

const profileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  university: z.string().optional(),
  graduationYear: z.string().optional(),
  gpa: z.string().optional(),
  targetRoles: z.array(z.string()).optional(),
  targetLocations: z.array(z.string()).optional(),
  minSalary: z.number().optional(),
  skills: z.array(z.string()).optional(),
  experiences: z
    .array(
      z.object({
        company: z.string(),
        role: z.string(),
        duration: z.string(),
        bullets: z.array(z.string()),
      })
    )
    .optional(),
  rawResumeText: z.string().optional(),
  parsedSummary: z.string().optional(),
  atsScore: z.number().int().optional(),
  resumeUrl: z.string().nullable().optional(),
});

const taskSchema = z.object({
  applicationId: z.string(),
  stepId: z.string(),
  taskId: z.string(),
  completed: z.boolean(),
});

export async function handleSwipe(input: SwipeInput) {
  const session = await requireSession();
  const data = swipeSchema.parse(input);
  const userId = session.user.id;

  const job = await prisma.job.findFirst({ where: { id: data.jobId, isActive: true } });
  if (!job) throw new Error('Job not found');

  const status: ApplicationStatus =
    data.direction === 'right' ? 'APPLIED' : data.direction === 'save' ? 'SAVED' : 'DISCARDED';

  const application = await prisma.application.upsert({
    where: { userId_jobId: { userId, jobId: data.jobId } },
    create: {
      userId,
      jobId: data.jobId,
      status,
      appliedAt: status === 'APPLIED' ? new Date() : null,
      roadmapStatus: status === 'APPLIED' && data.generateRoadmap ? 'GENERATING' : 'PENDING',
    },
    update: {
      status,
      appliedAt: status === 'APPLIED' ? new Date() : undefined,
      roadmapStatus:
        status === 'APPLIED' && data.generateRoadmap ? 'GENERATING' : undefined,
    },
    include: { job: true },
  });

  if (status === 'APPLIED' && data.generateRoadmap) {
    const limit = await checkAndIncrementRateLimit(userId, 'generate-roadmap');
    if (limit.allowed) {
      await enqueue('generate-roadmap', {
        applicationId: application.id,
        userId,
      });
    } else {
      await prisma.application.update({
        where: { id: application.id },
        data: { roadmapStatus: 'PENDING' },
      });
    }
  }

  revalidatePath('/discover');
  revalidatePath('/companies');

  return {
    success: true,
    application: mapApplicationToClient(application),
    applyUrl: status === 'APPLIED' ? job.applyUrl : null,
  };
}

export async function updateApplicationStatus(input: z.infer<typeof statusSchema>) {
  const session = await requireSession();
  const data = statusSchema.parse(input);

  const application = await prisma.application.upsert({
    where: {
      userId_jobId: { userId: session.user.id, jobId: data.jobId },
    },
    create: {
      userId: session.user.id,
      jobId: data.jobId,
      status: data.status,
      notes: data.notes,
      appliedAt: data.status === 'APPLIED' ? new Date() : null,
    },
    update: {
      status: data.status,
      notes: data.notes,
    },
    include: { job: true },
  });

  revalidatePath('/companies');
  return { success: true, application: mapApplicationToClient(application) };
}

export async function updateProfile(input: Partial<UserProfile>) {
  const session = await requireSession();
  const data = profileSchema.parse(input);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const prefs = parsePreferences(user.preferences);

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name ?? user.name,
      email: data.email ?? user.email,
      atsScore: data.atsScore ?? user.atsScore,
      skills: data.skills ?? user.skills,
      targetRoles: data.targetRoles ?? user.targetRoles,
      resumeUrl: data.resumeUrl === undefined ? user.resumeUrl : data.resumeUrl,
      preferences: {
        ...prefs,
        university: data.university ?? prefs.university,
        graduationYear: data.graduationYear ?? prefs.graduationYear,
        gpa: data.gpa ?? prefs.gpa,
        targetLocations: data.targetLocations ?? prefs.targetLocations,
        minSalary: data.minSalary ?? prefs.minSalary,
        experiences: data.experiences ?? prefs.experiences,
        rawResumeText: data.rawResumeText ?? prefs.rawResumeText,
        parsedSummary: data.parsedSummary ?? prefs.parsedSummary,
      } as object,
    },
  });

  revalidatePath('/profile');
  revalidatePath('/resume');
  revalidatePath('/discover');

  return { success: true, userId: updated.id };
}

export async function enqueueResumeParse(input: {
  resumeText?: string;
  resumeUrl?: string;
}) {
  const session = await requireSession();
  const userId = session.user.id;

  if (!input.resumeText && !input.resumeUrl) {
    throw new Error('Resume text or URL is required');
  }

  const limit = await checkAndIncrementRateLimit(userId, 'parse-resume');
  if (!limit.allowed) {
    throw new Error('Daily resume parse limit reached. Try again tomorrow.');
  }

  if (input.resumeUrl) {
    await prisma.user.update({
      where: { id: userId },
      data: { resumeUrl: input.resumeUrl },
    });
  }

  const job = await enqueue('parse-resume', {
    userId,
    resumeText: input.resumeText,
    resumeUrl: input.resumeUrl,
  });

  return { success: true, jobId: job.id };
}

export async function enqueueRoadmap(applicationId: string) {
  const session = await requireSession();
  const userId = session.user.id;

  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId },
  });
  if (!application) throw new Error('Application not found');

  const limit = await checkAndIncrementRateLimit(userId, 'generate-roadmap');
  if (!limit.allowed) {
    throw new Error('Daily roadmap generation limit reached. Try again tomorrow.');
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: { roadmapStatus: 'GENERATING' },
  });

  const job = await enqueue('generate-roadmap', { applicationId, userId });
  revalidatePath('/companies');
  revalidatePath(`/companies/${applicationId}`);

  return { success: true, jobId: job.id };
}

export async function updateRoadmapTask(input: z.infer<typeof taskSchema>) {
  const session = await requireSession();
  const data = taskSchema.parse(input);

  const application = await prisma.application.findFirst({
    where: { id: data.applicationId, userId: session.user.id },
  });
  if (!application?.roadmap) throw new Error('Roadmap not found');

  const parsed = roadmapSchema.parse(application.roadmap);
  const steps = parsed.steps.map((step) => {
    if (step.id !== data.stepId) return step;
    return {
      ...step,
      tasks: step.tasks.map((task) =>
        task.id === data.taskId ? { ...task, completed: data.completed } : task
      ),
    };
  });

  const updatedRoadmap = { ...parsed, steps };

  await prisma.application.update({
    where: { id: data.applicationId },
    data: { roadmap: updatedRoadmap },
  });

  revalidatePath(`/companies/${data.applicationId}`);
  return { success: true, roadmap: updatedRoadmap };
}

export async function getApplicationStatus(applicationId: string) {
  const session = await requireSession();
  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId: session.user.id },
    include: { job: true },
  });
  if (!application) throw new Error('Application not found');
  return mapApplicationToClient(application);
}

export async function getResumeParseJobStatus(jobId: string) {
  const session = await requireSession();
  const job = await prisma.aiJob.findFirst({
    where: { id: jobId, userId: session.user.id },
  });
  if (!job) throw new Error('Job not found');
  return {
    id: job.id,
    status: job.status,
    error: job.error,
    result: job.result,
  };
}
