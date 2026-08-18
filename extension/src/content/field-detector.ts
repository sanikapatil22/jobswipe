import type { Confidence, FieldType } from '../types';

export interface DetectedField {
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  fieldType: FieldType;
  confidence: Confidence;
  score: number;
  label: string;
}

const MAX_SIGNAL_LENGTH = 90;

/** Never-fill control types. */
const SKIP_TYPES = new Set([
  'hidden',
  'password',
  'submit',
  'button',
  'image',
  'reset',
  'range',
  'color',
]);

/** Security-sensitive names we never touch or even list. */
const SKIP_NAME_PATTERNS = /(password|passwd|token|csrf|_csrf|authenticity|captcha|otp|secret|ssn|social\s*security|card\s*number|cvv)/i;

interface Rule {
  type: FieldType;
  pattern: RegExp;
  weight: number;
}

/** Lower weight = weaker signal. Autocomplete and type attributes are handled separately. */
const RULES: Rule[] = [
  { type: 'EMAIL', pattern: /e-?mail|email\s*address/i, weight: 3 },
  { type: 'FIRST_NAME', pattern: /first\s*name|fname|given\s*name/i, weight: 3 },
  { type: 'LAST_NAME', pattern: /last\s*name|lname|family\s*name|surname/i, weight: 3 },
  { type: 'FULL_NAME', pattern: /^full\s*name$|^your\s*name$|^name$|^applicant\s*name$|^candidate\s*name$/i, weight: 3 },
  { type: 'PHONE', pattern: /phone|telephone|mobile|cell|contact\s*(number|no\.?)/i, weight: 3 },
  { type: 'ADDRESS', pattern: /street\s*address|^address$|^address\s*line/i, weight: 3 },
  { type: 'CITY', pattern: /^city$|city\s*(of)?|town/i, weight: 3 },
  { type: 'STATE', pattern: /state|province|region/i, weight: 2 },
  { type: 'COUNTRY', pattern: /country/i, weight: 3 },
  { type: 'ZIP', pattern: /zip|postal|post\s*code/i, weight: 3 },
  { type: 'UNIVERSITY', pattern: /university|college|institution|school/i, weight: 2 },
  { type: 'DEGREE', pattern: /degree|qualification|education\s*level/i, weight: 2 },
  { type: 'MAJOR', pattern: /major|field\s*of\s*study|concentration|discipline|area\s*of\s*study/i, weight: 2 },
  { type: 'GRADUATION_YEAR', pattern: /graduat|grad\s*year|class\s*of|year\s*of/i, weight: 3 },
  { type: 'LINKEDIN', pattern: /linkedin|linked-in/i, weight: 4 },
  { type: 'GITHUB', pattern: /github|git\s*hub/i, weight: 4 },
  { type: 'PORTFOLIO', pattern: /portfolio|personal\s*(website|site)|profile\s*url|^website$|^url$|^link$|^links?$/i, weight: 2 },
  { type: 'COMPANY', pattern: /company|employer|organization|current\s*employer/i, weight: 2 },
  { type: 'JOB_TITLE', pattern: /job\s*title|current\s*(job|role|position|title)|^title$|position\s*title/i, weight: 2 },
  { type: 'YEARS_EXPERIENCE', pattern: /years?\s*of\s*(experience|work)|years?\s*(experience)|work\s*experience/i, weight: 2 },
  { type: 'RESUME', pattern: /resume|cv\b|curriculum\s*vitae|attach\s*(your\s*)?(resume|cv)/i, weight: 3 },
  // Open questions — NEVER auto-answered (no verified structured answer exists).
  { type: 'QUESTION', pattern: /why\s*(do|are|would)|cover\s*letter|tell\s*us|describe|authorized|authorization|sponsorship|sponsor\b|how\s*did\s*you\s*hear|salary\s*(expectation|requirement)|desired\s*salary|gender|race|ethnicity|veteran|disability|diversity|referral|additional\s*(information|comments|notes)|anything\s*else|start\s*date|availability|notice\s*period|work\s*authorization|legally\s*eligible/i, weight: 3 },
];

const AUTOCOMPLETE_MAP: Record<string, FieldType> = {
  'given-name': 'FIRST_NAME',
  'family-name': 'LAST_NAME',
  name: 'FULL_NAME',
  email: 'EMAIL',
  tel: 'PHONE',
  'tel-national': 'PHONE',
  'street-address': 'ADDRESS',
  'address-line1': 'ADDRESS',
  'address-line2': 'ADDRESS',
  'address-level1': 'STATE',
  'address-level2': 'CITY',
  'postal-code': 'ZIP',
  country: 'COUNTRY',
  organization: 'COMPANY',
  'organization-title': 'JOB_TITLE',
  url: 'PORTFOLIO',
};

function signalText(...values: Array<string | null | undefined>): string[] {
  return values
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim().slice(0, MAX_SIGNAL_LENGTH));
}

function labelFor(el: Element, doc: Document): string {
  const id = el.getAttribute('id');
  if (id) {
    const labelled = doc.querySelector<HTMLElement>(`label[for="${CSS.escape(id)}"]`);
    if (labelled?.innerText?.trim()) return labelled.innerText.trim();
  }
  const wrapped = el.closest('label');
  if (wrapped?.innerText?.trim()) return wrapped.innerText.trim();
  const ariaLabelledBy = el.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const parts = ariaLabelledBy.split(/\s+/).map((part) => doc.getElementById(part)?.innerText?.trim()).filter(Boolean);
    if (parts.length) return parts.join(' ');
  }
  return '';
}

function nearbyText(el: Element): string {
  const prev = el.previousElementSibling as HTMLElement | null;
  if (prev?.innerText?.trim()) return prev.innerText.trim().slice(0, MAX_SIGNAL_LENGTH);
  const parent = el.parentElement;
  const grandPrev = parent?.previousElementSibling as HTMLElement | null;
  if (grandPrev?.innerText?.trim()) return grandPrev.innerText.trim().slice(0, MAX_SIGNAL_LENGTH);
  if (parent) {
    const text = (parent.innerText || '').replace(/\s+/g, ' ').trim();
    if (text && text.length <= MAX_SIGNAL_LENGTH * 2) return text;
  }
  return '';
}

function classify(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  doc: Document
): { fieldType: FieldType; score: number; label: string } | null {
  const signals: string[] = [];
  const label = labelFor(el, doc);

  // Security-sensitive: never touch.
  const name = el.getAttribute('name') || '';
  const id = el.getAttribute('id') || '';
  if (SKIP_NAME_PATTERNS.test(`${name} ${id}`)) return null;

  // File inputs are always the resume upload.
  if (el instanceof HTMLInputElement && el.type === 'file') {
    return { fieldType: 'RESUME', score: 5, label: label || 'Resume upload' };
  }

  if (el instanceof HTMLInputElement && SKIP_TYPES.has(el.type)) return null;

  // Checkboxes / radios: report as needs-review only when they look like a
  // question or a known personal field; never auto-check.
  if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
    const text = [label, name, id, el.getAttribute('aria-label')].filter(Boolean).join(' ');
    const question = RULES.find((rule) => rule.type === 'QUESTION' && rule.pattern.test(text));
    if (question) return { fieldType: 'QUESTION', score: question.weight + 1, label: label || text.slice(0, 60) };
    return null;
  }

  if (el instanceof HTMLInputElement && el.type === 'date') {
    const text = [label, name, id, el.getAttribute('aria-label')].filter(Boolean).join(' ');
    if (/graduat|class\s*of/i.test(text)) {
      return { fieldType: 'GRADUATION_YEAR', score: 4, label: label || text.slice(0, 60) };
    }
    return null;
  }

  const autocomplete = el.getAttribute('autocomplete') || '';
  const type = el instanceof HTMLInputElement ? el.type : '';

  // Element-specific signals carry full weight; surrounding row text is
  // half-weight so sibling fields (e.g. first/last name pairs) don't collide.
  const ownSignals = signalText(
    label,
    el.getAttribute('placeholder'),
    el.getAttribute('aria-label'),
    name,
    id
  );
  const contextSignals = signalText(nearbyText(el));

  const scores = new Map<FieldType, number>();
  const addScore = (type: FieldType, weight: number) =>
    scores.set(type, (scores.get(type) ?? 0) + weight);

  // Strongest signals first.
  if (AUTOCOMPLETE_MAP[autocomplete]) addScore(AUTOCOMPLETE_MAP[autocomplete], 4);
  if (type === 'email') addScore('EMAIL', 3);
  if (type === 'tel') addScore('PHONE', 3);
  if (type === 'url') addScore('PORTFOLIO', 1);

  for (const signal of ownSignals) {
    for (const rule of RULES) {
      if (rule.pattern.test(signal)) addScore(rule.type, rule.weight);
    }
  }
  for (const signal of contextSignals) {
    for (const rule of RULES) {
      if (rule.pattern.test(signal)) addScore(rule.type, rule.weight * 0.5);
    }
  }

  // Question fields dominate — never auto-answer.
  if ((scores.get('QUESTION') ?? 0) >= 3) {
    return { fieldType: 'QUESTION', score: scores.get('QUESTION') ?? 3, label: label || name || 'Question' };
  }

  let best: FieldType | null = null;
  let bestScore = 0;
  for (const [type, score] of scores) {
    if (score > bestScore) {
      best = type;
      bestScore = score;
    }
  }

  if (!best || bestScore < 2.25) {
    const fallback = label || name || id || 'Unknown field';
    return { fieldType: 'OTHER', score: bestScore, label: fallback };
  }

  return { fieldType: best, score: bestScore, label: label || name || id };
}

function toConfidence(score: number): Confidence {
  if (score >= 3.5) return 'high';
  if (score >= 2.25) return 'medium';
  return 'low';
}

/** Scans the page for fillable form controls and classifies each one. */
export function findFields(doc: Document): DetectedField[] {
  const fields: DetectedField[] = [];
  const seenRadio = new Set<string>();

  const candidates = Array.from(
    doc.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input, textarea, select'
    )
  );

  for (const el of candidates) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.disabled) continue;
    if (el.isContentEditable) continue;
    if ((el as HTMLInputElement).readOnly) continue;
    if (!el.isConnected) continue;
    if ((el as HTMLInputElement).type === 'radio') {
      const group = el.getAttribute('name') || el.getAttribute('id') || '';
      if (seenRadio.has(group)) continue;
      seenRadio.add(group);
    }

    const classified = classify(el, doc);
    if (!classified) continue;

    fields.push({
      element: el,
      fieldType: classified.fieldType,
      confidence: toConfidence(classified.score),
      score: classified.score,
      label: classified.label,
    });
  }

  return fields;
}
