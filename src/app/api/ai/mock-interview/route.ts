import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { streamTextContent } from '@/lib/gemini/client';
import { interviewFeedbackSchema } from '@/lib/gemini/schemas';
import {
  buildMockInterviewPrompt,
  buildMockInterviewSystemInstruction,
} from '@/lib/gemini/prompts/mock-interview';
import { geminiConfig } from '@/lib/gemini/config';

export const runtime = 'nodejs';
export const maxDuration = 60;

const bodySchema = z.object({
  companyName: z.string(),
  role: z.string(),
  userMessage: z.string().min(1),
  targetQuestion: z.string(),
  history: z
    .array(z.object({ sender: z.string(), text: z.string() }))
    .default([]),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const json = await req.json();
  const data = bodySchema.parse(json);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullText = '';
        const prompt = buildMockInterviewPrompt(data);
        const systemInstruction = buildMockInterviewSystemInstruction(
          data.companyName,
          data.role
        );

        for await (const chunk of streamTextContent({
          prompt,
          systemInstruction,
          model: geminiConfig.proModel,
        })) {
          fullText += chunk;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'token', text: chunk })}\n\n`)
          );
        }

        let feedback = null;
        try {
          const jsonMatch =
            fullText.match(/```json\s*([\s\S]*?)\s*```/) ||
            fullText.match(/\{[\s\S]*"rating"[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            feedback = interviewFeedbackSchema.parse(parsed);
          }
        } catch {
          feedback = null;
        }

        const cleanText =
          fullText.replace(/```json[\s\S]*?```/g, '').trim() || fullText;

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'done', reply: cleanText, feedback })}\n\n`
          )
        );
        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Stream failed';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
