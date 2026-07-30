/**
 * Strip common prompt-injection phrases from user/external-supplied text
 * before interpolating into Gemini prompts.
 */
export function sanitizePromptInput(text: string, maxLength = 50000): string {
  const stripped = text
    .replace(/ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi, '[filtered]')
    .replace(/disregard\s+(all\s+)?(previous|prior|above)\s+instructions?/gi, '[filtered]')
    .replace(/system\s*:\s*/gi, '')
    .replace(/<\s*\/?\s*system\s*>/gi, '');

  return stripped.slice(0, maxLength);
}

export function wrapDelimited(label: string, content: string): string {
  return `${label}:\n"""\n${sanitizePromptInput(content)}\n"""`;
}
