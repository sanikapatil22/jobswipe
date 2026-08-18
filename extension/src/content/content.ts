import type { AutofillResult, ContentCommand, ContentMessage, DetectedJob } from '../types';
import { detectJob } from './adapters';
import { rememberAutofill, runAutofill, watchDynamicFields } from './autofill';

function detectHasForm(doc: Document): boolean {
  const root = doc.querySelector('form, [role="form"]');
  if (!root) return false;
  return Boolean(
    root.querySelector('input, textarea, select, button[type="submit"], input[type="submit"]')
  );
}

let lastDetected: DetectedJob | null = null;
let lastHasForm = false;

function reportDetection() {
  const detected = detectJob(window.location.href, document);
  const hasForm = detectHasForm(document);
  if (
    JSON.stringify(detected) === JSON.stringify(lastDetected) &&
    hasForm === lastHasForm
  ) {
    return;
  }
  lastDetected = detected;
  lastHasForm = hasForm;

  const message: ContentMessage = { type: 'JOB_DETECTED', detected, hasForm };
  try {
    chrome.runtime.sendMessage(message).catch(() => undefined);
  } catch {
    // Extension context may be invalidated during navigation.
  }
}

// ---- SPA navigation detection (debounced, lightweight) -----------------------

let navTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleRedetect() {
  if (navTimer) clearTimeout(navTimer);
  navTimer = setTimeout(reportDetection, 500);
}

function patchHistoryMethod(method: 'pushState' | 'replaceState') {
  const original = history[method];
  history[method] = function (this: History, ...args: Parameters<typeof history.pushState>) {
    const result = original.apply(this, args);
    scheduleRedetect();
    return result;
  };
}

function installNavigationWatchers() {
  patchHistoryMethod('pushState');
  patchHistoryMethod('replaceState');
  window.addEventListener('popstate', scheduleRedetect);
  window.addEventListener('hashchange', scheduleRedetect);

  // Title changes are a strong signal for SPA job pages.
  const titleEl = document.querySelector('title');
  if (titleEl) {
    new MutationObserver(scheduleRedetect).observe(titleEl, { childList: true, subtree: true });
  }

  // Initial detection once the DOM is settled.
  scheduleRedetect();
}

// ---- message handling ---------------------------------------------------------

chrome.runtime.onMessage.addListener(
  (
    message: ContentCommand,
    _sender,
    sendResponse: (response: unknown) => void
  ) => {
    if (message.type === 'PING') {
      sendResponse({ pong: true });
      return false;
    }

    if (message.type === 'GET_DETECTION') {
      sendResponse({ detected: lastDetected, hasForm: lastHasForm });
      return false;
    }

    if (message.type === 'AUTOFILL') {
      let result: AutofillResult;
      try {
        result = runAutofill(document, message.profile);
        rememberAutofill(message.profile, result);
        watchDynamicFields(document, (updated) => {
          const update: ContentMessage = {
            type: 'AUTOFILL_UPDATED',
            result: updated,
          };
          try {
            chrome.runtime.sendMessage(update).catch(() => undefined);
          } catch {
            // ignore
          }
        });
      } catch (error) {
        result = {
          filled: [],
          needsReview: [],
          filledCount: 0,
          reviewCount: 0,
          notes: [error instanceof Error ? error.message : 'Autofill failed'],
        };
      }
      sendResponse(result);
      return false;
    }

    return false;
  }
);

installNavigationWatchers();
