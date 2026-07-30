import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';

/**
 * Worker → app callback when a Gemini background job completes.
 * Triggers path revalidation so React Query / RSC pick up READY/FAILED state.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-worker-secret');
  if (secret !== (process.env.WORKER_SECRET || 'dev-worker-secret')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const type = body.type as string;

  if (type === 'parse-resume') {
    revalidatePath('/resume');
    revalidatePath('/profile');
    revalidatePath('/discover');
  }

  if (type === 'generate-roadmap') {
    revalidatePath('/companies');
  }

  if (type === 'compute-match') {
    revalidatePath('/discover');
  }

  return NextResponse.json({ ok: true });
}
