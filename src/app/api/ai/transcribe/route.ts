import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { auth } from '@/lib/auth';
import { assertGeminiConfigured, geminiConfig } from '@/lib/gemini/config';

export const runtime = 'nodejs';
export const maxDuration = 60;

const bodySchema = z.object({
  audioBase64: z.string().min(1),
  mimeType: z.string().min(1).max(100),
});

/**
 * Transcribes a recorded answer (audio blob -> text) using Gemini.
 * This is the fallback for browsers where the Web Speech API is unavailable
 * or fails (Chrome has deprecated it for most users), so candidates can still
 * answer the mock interview with their voice.
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let data: z.infer<typeof bodySchema>;
  try {
    data = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid audio payload' }, { status: 400 });
  }

  try {
    assertGeminiConfigured();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gemini is not configured' },
      { status: 503 }
    );
  }

  const ai = new GoogleGenAI({ apiKey: geminiConfig.apiKey });

  try {
    const response = await ai.models.generateContent({
      model: geminiConfig.flashModel,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Transcribe this audio clip of a person answering a job-interview question. Output ONLY the transcribed words — no commentary, no timestamps, no "Here is the transcript" phrasing. If nothing intelligible is spoken, reply with exactly: [no speech]',
            },
            {
              inlineData: {
                mimeType: data.mimeType,
                data: data.audioBase64,
              },
            },
          ],
        },
      ],
    });

    const text = (response.text || '').trim();
    if (!text || text === '[no speech]') {
      return NextResponse.json(
        { error: 'No speech detected — speak closer to the mic and try again.' },
        { status: 422 }
      );
    }
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transcription failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
