import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { markJobCompleted, markJobFailed, markJobRunning } from '@/lib/queue';
import { parseResumeJob } from '@/server/jobs/resume-parse';
import { generateRoadmapJob } from '@/server/jobs/roadmap-gen';
import { computeMatchJob } from '@/server/jobs/match';
import type {
  ComputeMatchPayload,
  GenerateRoadmapPayload,
  JobType,
  ParseResumePayload,
} from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-worker-secret');
  if (secret !== (process.env.WORKER_SECRET || 'dev-worker-secret')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const jobId = body.jobId as string;
  const type = body.type as JobType;
  const payload = body.payload;

  if (!jobId || !type) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  await markJobRunning(jobId);

  try {
    let result: unknown;

    switch (type) {
      case 'parse-resume':
        result = await parseResumeJob(payload as ParseResumePayload);
        break;
      case 'generate-roadmap':
        result = await generateRoadmapJob(payload as GenerateRoadmapPayload);
        break;
      case 'compute-match':
        result = await computeMatchJob(payload as ComputeMatchPayload);
        break;
      default:
        throw new Error(`Unknown job type: ${type}`);
    }

    await markJobCompleted(jobId, result);

    // Notify app webhook (optional client revalidation hook)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
    if (appUrl) {
      void fetch(`${appUrl}/api/webhooks/gemini-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-worker-secret': process.env.WORKER_SECRET || 'dev-worker-secret',
        },
        body: JSON.stringify({ jobId, type, status: 'COMPLETED' }),
      }).catch(() => undefined);
    }

    return NextResponse.json({ success: true, jobId, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Worker failed';
    await markJobFailed(jobId, message);
    console.error(`Worker job ${jobId} failed:`, error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// Allow local debugging of job status
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });
  const job = await prisma.aiJob.findUnique({ where: { id: jobId } });
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(job);
}
