import { GoogleGenAI } from '@google/genai';
import { assertGeminiConfigured, geminiConfig } from './config';
import { z } from 'zod';

let client: GoogleGenAI | null = null;

export function getGeminiClient() {
  assertGeminiConfigured();
  if (!client) {
    client = new GoogleGenAI({
      apiKey: geminiConfig.apiKey,
    });
  }
  return client;
}

/**
 * Tolerantly parse model JSON output: strips fences, recovers from trailing
 * commas, and extracts the largest balanced JSON blob if the model added
 * commentary around it.
 */
export function safeParseJson(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();  const candidates: string[] = [];
  candidates.push(cleaned);
  candidates.push(cleaned.replace(/, \s*([}\]])/g, '$1'));

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    // The model sometimes appends commentary (or a stray closing brace)
    // after the JSON object — progressively trim trailing braces.
    let end = lastBrace;
    for (let i = 0; i < 12; i++) {
      const blob = cleaned.slice(firstBrace, end + 1);
      candidates.push(blob);
      candidates.push(blob.replace(/, \s*([}\]])/g, '$1'));
      const previous = cleaned.lastIndexOf('}', end - 1);
      if (previous <= firstBrace) break;
      end = previous;
    }
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // try the next candidate
    }
  }
  throw new Error(`Could not parse JSON from model output: ${cleaned.slice(0, 200)}`);
}

export async function generateJsonContent<T>(options: {
  prompt: string;
  schema: z.ZodType<T>;
  model?: string;
  strictPrompt?: string;
  systemInstruction?: string;
}): Promise<T> {
  const ai = getGeminiClient();
  const model = options.model ?? geminiConfig.flashModel;

  const attempt = async (prompt: string) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        ...(options.systemInstruction ? { systemInstruction: options.systemInstruction } : {}),
      },
    });

    const text = response.text || '{}';
    const parsed = safeParseJson(text);
    return options.schema.parse(parsed);
  };

  try {
    return await attempt(options.prompt);
  } catch (firstError) {
    if (!options.strictPrompt) throw firstError;
    return await attempt(options.strictPrompt);
  }
}

export async function generateTextContent(options: {
  prompt: string;
  systemInstruction?: string;
  model?: string;
}): Promise<string> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: options.model ?? geminiConfig.proModel,
    contents: options.prompt,
    config: {
      ...(options.systemInstruction ? { systemInstruction: options.systemInstruction } : {}),
    },
  });
  return response.text || '';
}

export async function* streamTextContent(options: {
  prompt: string;
  systemInstruction?: string;
  model?: string;
}): AsyncGenerator<string> {
  const ai = getGeminiClient();
  const stream = await ai.models.generateContentStream({
    model: options.model ?? geminiConfig.proModel,
    contents: options.prompt,
    config: {
      ...(options.systemInstruction ? { systemInstruction: options.systemInstruction } : {}),
    },
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) yield text;
  }
}
