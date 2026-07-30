/**
 * Gemini model IDs — override via env without code changes.
 * Verify current IDs against Google's docs at deploy time.
 */
export const geminiConfig = {
  flashModel: process.env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash',
  proModel: process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro',
  apiKey: process.env.GEMINI_API_KEY || '',
} as const;

export function assertGeminiConfigured() {
  if (!geminiConfig.apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
}
