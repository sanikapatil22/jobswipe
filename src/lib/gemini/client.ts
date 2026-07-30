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
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
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
