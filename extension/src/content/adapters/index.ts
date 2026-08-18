import type { DetectedJob } from '../../types';
import { detectGreenhouse, isGreenhouseUrl } from './greenhouse';
import { detectLever, isLeverUrl } from './lever';
import { detectGeneric } from './generic';

export type { DetectedJob };

/**
 * JobApplicationAdapter pattern — add new job boards by implementing a
 * `detect(url, doc)` function and registering it here. Detection must use
 * several independent signals (URL, title, structured data, visible content),
 * never a single fragile selector.
 */
export function detectJob(url: string, doc: Document): DetectedJob | null {
  if (isGreenhouseUrl(url)) {
    const detected = detectGreenhouse(url, doc);
    if (detected) return detected;
  }

  if (isLeverUrl(url)) {
    const detected = detectLever(url, doc);
    if (detected) return detected;
  }

  return detectGeneric(url, doc);
}
