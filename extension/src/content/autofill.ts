import type { AutofillProfile, AutofillResult, FieldFill, FieldType } from '../types';
import { findFields, type DetectedField } from './field-detector';

/** Types safe to fill even at medium confidence (unambiguous values). */
const SAFE_MEDIUM = new Set<FieldType>([
  'FIRST_NAME',
  'LAST_NAME',
  'FULL_NAME',
  'EMAIL',
  'PHONE',
  'ZIP',
  'CITY',
  'STATE',
  'COUNTRY',
  'ADDRESS',
  'UNIVERSITY',
  'GRADUATION_YEAR',
  'DEGREE',
  'MAJOR',
  'LINKEDIN',
  'GITHUB',
  'PORTFOLIO',
  'COMPANY',
  'JOB_TITLE',
]);

/** Fields SwipePrep has verified data for (everything else is review-only). */
const VALUED_TYPES = new Set<FieldType>([
  'FIRST_NAME',
  'LAST_NAME',
  'FULL_NAME',
  'EMAIL',
  'UNIVERSITY',
  'GRADUATION_YEAR',
  'COMPANY',
  'JOB_TITLE',
]);

function buildValues(profile: AutofillProfile): Partial<Record<FieldType, string>> {
  const firstExperience = profile.experiences[0];
  return {
    FIRST_NAME: profile.firstName,
    LAST_NAME: profile.lastName,
    FULL_NAME: profile.name,
    EMAIL: profile.email,
    UNIVERSITY: profile.university,
    GRADUATION_YEAR: profile.graduationYear,
    COMPANY: firstExperience?.company,
    JOB_TITLE: firstExperience?.role,
  };
}

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto =
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }
}

function dispatchEvents(el: HTMLElement) {
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('blur', { bubbles: false }));
}

function normalizeOptionText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function selectOption(select: HTMLSelectElement, value: string): boolean {
  const target = normalizeOptionText(value);
  const options = Array.from(select.options);

  const exact = options.find((option) => normalizeOptionText(option.text) === target);
  if (exact) {
    select.value = exact.value;
    return true;
  }

  const numericTarget = target.replace(/[^0-9]/g, '');
  if (numericTarget) {
    const numeric = options.find(
      (option) => normalizeOptionText(option.text).replace(/[^0-9]/g, '') === numericTarget
    );
    if (numeric) {
      select.value = numeric.value;
      return true;
    }
  }

  const contains = options.find(
    (option) =>
      normalizeOptionText(option.text).includes(target) ||
      target.includes(normalizeOptionText(option.text))
  );
  if (contains) {
    select.value = contains.value;
    return true;
  }

  return false;
}

function toFill(
  field: DetectedField,
  value?: string,
  reason?: string,
  filled = false
): FieldFill {
  return {
    fieldType: field.fieldType,
    label: field.label,
    confidence: field.confidence,
    value: filled ? value : undefined,
    reason,
    element: field.element,
  };
}

/**
 * Fills the detected fields from the profile. Strict rules:
 *  - QUESTION / RESUME fields are never auto-filled.
 *  - Low-confidence or unidentified fields are left for review.
 *  - Fields SwipePrep has no data for are left for review.
 *  - Never invents experience, skills, work authorization, or sponsorship.
 */
export function runAutofill(doc: Document, profile: AutofillProfile): AutofillResult {
  const values = buildValues(profile);
  const filled: FieldFill[] = [];
  const needsReview: FieldFill[] = [];
  const notes: string[] = [];

  const fields = findFields(doc);

  for (const field of fields) {
    if (field.fieldType === 'QUESTION') {
      needsReview.push(toFill(field, undefined, 'Open question — review before submitting'));
      continue;
    }

    if (field.fieldType === 'RESUME') {
      needsReview.push(
        toFill(field, undefined, 'Please upload your tailored resume manually.')
      );
      continue;
    }

    if (field.fieldType === 'OTHER') {
      needsReview.push(toFill(field, undefined, "Couldn't identify this field — not filled"));
      continue;
    }

    if (!VALUED_TYPES.has(field.fieldType)) {
      needsReview.push(
        toFill(field, undefined, 'SwipePrep has no data for this field — add it in your profile')
      );
      continue;
    }

    const value = values[field.fieldType];
    if (!value || !value.trim()) {
      needsReview.push(toFill(field, undefined, 'Missing from your SwipePrep profile'));
      continue;
    }

    if (field.confidence === 'low') {
      needsReview.push(toFill(field, undefined, 'Low-confidence field — not filled'));
      continue;
    }

    if (field.confidence === 'medium' && !SAFE_MEDIUM.has(field.fieldType)) {
      needsReview.push(toFill(field, undefined, 'Uncertain field — not filled'));
      continue;
    }

    if (field.element instanceof HTMLSelectElement) {
      if (!selectOption(field.element, value)) {
        needsReview.push(
          toFill(field, undefined, `No matching option for “${value}” — pick manually`)
        );
        continue;
      }
      dispatchEvents(field.element);
      filled.push(toFill(field, value, undefined, true));
      continue;
    }

    setNativeValue(field.element, value);
    dispatchEvents(field.element);
    filled.push(toFill(field, value, undefined, true));
  }

  return {
    filled,
    needsReview,
    filledCount: filled.length,
    reviewCount: needsReview.length,
    notes,
  };
}

// ---- dynamic forms ----------------------------------------------------------

const handled = new WeakSet<HTMLElement>();
let observer: MutationObserver | null = null;
let lastProfile: AutofillProfile | null = null;
let lastResult: AutofillResult | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Watches for dynamically added form fields and autofills them with the last
 * profile, debounced and throttled — no continuous full-DOM scanning.
 */
export function watchDynamicFields(
  doc: Document,
  onUpdate: (result: AutofillResult) => void
) {
  if (observer) observer.disconnect();

  observer = new MutationObserver(() => {
    const profile = lastProfile;
    if (!profile) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const result = runAutofill(doc, profile);
      // Only act on fields we haven't already handled.
      const fresh = result.filled.filter((fill) =>
        fill.element ? !handled.has(fill.element) : false
      );
      if (fresh.length === 0) return;
      for (const fill of result.filled) {
        if (fill.element) handled.add(fill.element);
      }
      const merged: AutofillResult = {
        filled: [...(lastResult?.filled ?? []), ...result.filled],
        needsReview: [...(lastResult?.needsReview ?? []), ...result.needsReview],
        filledCount: (lastResult?.filledCount ?? 0) + result.filledCount,
        reviewCount: (lastResult?.reviewCount ?? 0) + result.reviewCount,
        notes: result.notes,
      };
      lastResult = merged;
      onUpdate(merged);
    }, 600);
  });

  observer.observe(doc.body, { childList: true, subtree: true });
}

/** Records a completed autofill so dynamic fields reuse the same profile. */
export function rememberAutofill(profile: AutofillProfile, result: AutofillResult) {
  lastProfile = profile;
  lastResult = result;
  for (const fill of result.filled) {
    if (fill.element) handled.add(fill.element);
  }
}
