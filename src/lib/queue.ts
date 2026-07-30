import { prisma } from '@/lib/prisma';
import type { JobType } from '@/types';

function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

/**
 * Queue abstraction: persists an AiJob row, then dispatches to a worker.
 * Prefer Upstash QStash when configured; otherwise self-invoke the worker route.
 */
export async function enqueue(type: JobType, payload: Record<string, unknown>) {
  const job = await prisma.aiJob.create({
    data: {
      type,
      status: 'PENDING',
      payload: payload as object,
      userId: typeof payload.userId === 'string' ? payload.userId : null,
    },
  });

  const body = JSON.stringify({ jobId: job.id, type, payload });
  const workerSecret = process.env.WORKER_SECRET || 'dev-worker-secret';

  if (process.env.QSTASH_TOKEN) {
    try {
      const { Client } = await import('@upstash/qstash');
      const qstash = new Client({ token: process.env.QSTASH_TOKEN });
      await qstash.publishJSON({
        url: `${getAppUrl()}/api/workers/process`,
        body: { jobId: job.id, type, payload },
        headers: { 'x-worker-secret': workerSecret },
      });
      return job;
    } catch (err) {
      console.warn('QStash dispatch failed, falling back to HTTP self-invoke', err);
    }
  }

  // Fire-and-forget self-invoke (dev / no QStash)
  const url = `${getAppUrl()}/api/workers/process`;
  void fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-worker-secret': workerSecret,
    },
    body,
  }).catch((err) => {
    console.error('Failed to dispatch worker job', job.id, err);
  });

  return job;
}

export async function markJobRunning(jobId: string) {
  return prisma.aiJob.update({
    where: { id: jobId },
    data: { status: 'RUNNING', attempts: { increment: 1 } },
  });
}

export async function markJobCompleted(jobId: string, result?: unknown) {
  return prisma.aiJob.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      result: result ? (result as object) : undefined,
      completedAt: new Date(),
      error: null,
    },
  });
}

export async function markJobFailed(jobId: string, error: string) {
  return prisma.aiJob.update({
    where: { id: jobId },
    data: {
      status: 'FAILED',
      error,
      completedAt: new Date(),
    },
  });
}
