import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AccessToken } from 'livekit-server-sdk';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

const bodySchema = z.object({
  room: z.string().min(1).max(64).optional(),
  identity: z.string().min(1).max(64).optional(),
});

/**
 * Mints a LiveKit access token for the AI Mock Interview video room.
 * - With no room/identity: acts as a config probe so the UI can tell the user
 *   whether LiveKit is wired up.
 * - Requires LIVEKIT_API_KEY, LIVEKIT_API_SECRET and LIVEKIT_URL env vars.
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !url) {
    return NextResponse.json({
      configured: false,
      error:
        'LiveKit is not configured. Add LIVEKIT_API_KEY, LIVEKIT_API_SECRET and LIVEKIT_URL to your environment to enable the video interview.',
    });
  }

  const body = await req.json().catch(() => ({}));
  const data = bodySchema.parse(body);

  // Config probe — no token needed.
  if (!data.room || !data.identity) {
    return NextResponse.json({ configured: true });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: data.identity,
    name: session.user.name || session.user.email,
  });
  at.addGrant({
    room: data.room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await at.toJwt();

  return NextResponse.json({ configured: true, url, token, room: data.room });
}
