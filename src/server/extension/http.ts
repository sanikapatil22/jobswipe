import { NextRequest } from 'next/server';
import { corsHeaders } from '@/lib/cors';

export function extensionJson(
  request: NextRequest,
  data: unknown,
  init: { status?: number } = {}
): Response {
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json', ...Object.fromEntries(corsHeaders(request)) },
  });
}

export function extensionError(
  request: NextRequest,
  error: string,
  message: string,
  status = 400
): Response {
  return extensionJson(request, { ok: false, error, message }, { status });
}

export function unauthenticated(request: NextRequest): Response {
  return extensionError(request, 'UNAUTHENTICATED', 'You are not signed in to SwipePrep.', 401);
}
