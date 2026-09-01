export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

export function trimText(text: string, maxLength = 240): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function htmlExcerpt(html: string, maxLength = 240): string {
  return trimText(stripHtml(html), maxLength);
}

export function extractListItems(html: string, limit = 5): string[] {
  const items = Array.from(html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi))
    .map((match) => stripHtml(match[1]))
    .filter(Boolean);

  if (items.length > 0) return items.slice(0, limit);

  const paragraphs = stripHtml(html)
    .split(/(?:\.|\n|\r\n)/g)
    .map((part) => part.trim())
    .filter((part) => part.length > 24);

  return paragraphs.slice(0, limit);
}

export function extractKeywords(title: string, body: string, limit = 8): string[] {
  const raw = `${title} ${body}`.toLowerCase();  const stopWords = new Set([
    'and', 'the', 'for', 'with', 'you', 'will', 'our', 'this',
    'that', 'from', 'role', 'team', 'company', 'work', 'experience',
    'skills', 'ability', 'across', 'including', 'we', 'of', 'to',
    'a', 'in', 'on', 'as',
    // HTML / CSS / layout artefacts that shouldn't appear as tags
    'div', 'span', 'class', 'href', 'http', 'https', 'www',
    'com', 'html', 'css', 'img', 'src', 'alt', 'rel', 'target',
    'content', 'type', 'data', 'role', 'value', 'true', 'false',
    'style', 'font', 'line', 'list', 'link', 'meta', 'head',
    'body', 'text', 'code', 'form', 'input', 'label', 'table',
  ]);

  const candidates = raw
    .split(/[^a-z0-9+#.]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !stopWords.has(token));

  const seen = new Set<string>();
  const output: string[] = [];

  for (const token of candidates) {
    if (seen.has(token)) continue;
    seen.add(token);
    output.push(token);
    if (output.length >= limit) break;
  }

  return output;
}

export function buildCompanyBadgeDataUri(companyName: string): string {
  const initials = companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
  const hue = Array.from(companyName).reduce((sum, character) => sum + character.charCodeAt(0), 0) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" fill="none"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${hue} 85% 56%)"/><stop offset="100%" stop-color="hsl(${(hue + 40) % 360} 85% 45%)"/></linearGradient></defs><rect width="128" height="128" rx="32" fill="url(#g)"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700" fill="white">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function toUtcDate(input: string | number | Date | null | undefined): Date | null {
  if (!input) return null;
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}