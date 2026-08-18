import { NextRequest } from 'next/server';

/**
 * CORS for the SwipePrep Chrome extension.
 *
 * The extension runs at a `chrome-extension://<id>` origin, which varies per
 * install, so we reflect the request origin instead of hardcoding one. Only
 * extension origins (and same-origin requests from the app itself) are
 * allowed, and credentialed requests are supported so the extension reuses
 * the user's Better Auth session cookie.
 *
 * A reflected origin is also a lightweight CSRF guard: we reject cross-site
 * mutations whose Origin is neither the extension nor this app.
 */

const APP_ORIGINS = new Set([
  process.env.BETTER_AUTH_URL,
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean));

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin.startsWith('chrome-extension://')) return true;
  return APP_ORIGINS.has(origin);
}

export function corsHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  const origin = request.headers.get('origin');

  if (origin && isAllowedOrigin(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Vary', 'Origin');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return headers;
}

/** Returns true when the request may proceed (OPTIONS preflight short-circuits here). */
export function handleCorsPreflight(request: NextRequest): Response | null {
  if (request.method !== 'OPTIONS') return null;

  const headers = corsHeaders(request);
  const origin = request.headers.get('origin');

  if (origin && !isAllowedOrigin(origin)) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, { status: 204, headers });
}

/** Rejects cross-site mutations from unknown origins (CSRF hardening). */
export function assertAllowedOrigin(request: NextRequest): Response | null {
  const origin = request.headers.get('origin');
  if (!origin) return null; // same-origin / non-browser clients
  if (isAllowedOrigin(origin)) return null;
  return new Response(JSON.stringify({ error: 'Forbidden origin' }), { status: 403 });
}
