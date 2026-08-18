import type {
  AutofillProfile,
  AutofillResult,
  ContentCommand,
  ContentMessage,
  DetectedJob,
  PopupMessage,
  PopupStateResponse,
} from '../types';

interface TabState {
  detected: DetectedJob | null;
  hasForm: boolean;
  autofillResult: AutofillResult | null;
}

const tabState = new Map<number, TabState>();

function stateFor(tabId: number): TabState {
  let state = tabState.get(tabId);
  if (!state) {
    state = { detected: null, hasForm: false, autofillResult: null };
    tabState.set(tabId, state);
  }
  return state;
}

// Tidy up when tabs close.
chrome.tabs.onRemoved.addListener((tabId) => {
  tabState.delete(tabId);
});

async function pingContent(tabId: number): Promise<boolean> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'PING' } satisfies ContentCommand);
    return true;
  } catch {
    return false;
  }
}

async function askContentForDetection(tabId: number) {
  try {
    const response = (await chrome.tabs.sendMessage(tabId, {
      type: 'GET_DETECTION',
    } satisfies ContentCommand)) as { detected: DetectedJob | null; hasForm: boolean };
    const state = stateFor(tabId);
    state.detected = response.detected;
    state.hasForm = response.hasForm;
  } catch {
    // content script not present
  }
}

async function getPopupState(tabId: number): Promise<PopupStateResponse> {
  const state = stateFor(tabId);

  // Fresh detection from the content script (survives worker restarts).
  await askContentForDetection(tabId);

  return {
    detected: state.detected,
    hasForm: state.hasForm,
    contentScriptPresent: await pingContent(tabId),
  };
}

async function forwardAutofill(tabId: number, profile: AutofillProfile): Promise<AutofillResult> {
  try {
    const result = (await chrome.tabs.sendMessage(tabId, {
      type: 'AUTOFILL',
      profile,
    } satisfies ContentCommand)) as AutofillResult;
    stateFor(tabId).autofillResult = result;
    return result;
  } catch {
    return {
      filled: [],
      needsReview: [],
      filledCount: 0,
      reviewCount: 0,
      notes: ['Content script is not available on this page.'],
    };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const contentMessage = message as ContentMessage;

  if (contentMessage.type === 'JOB_DETECTED' && sender.tab?.id != null) {
    const state = stateFor(sender.tab.id);
    state.detected = contentMessage.detected;
    state.hasForm = contentMessage.hasForm;
    sendResponse({ ok: true });
    return false;
  }

  if (contentMessage.type === 'AUTOFILL_UPDATED' && sender.tab?.id != null) {
    stateFor(sender.tab.id).autofillResult = contentMessage.result;
    sendResponse({ ok: true });
    return false;
  }

  const popupMessage = message as PopupMessage;

  if (popupMessage.type === 'GET_STATE') {
    void getPopupState(popupMessage.tabId).then(sendResponse);
    return true; // async response
  }

  if (popupMessage.type === 'AUTOFILL') {
    void forwardAutofill(popupMessage.tabId, popupMessage.profile).then(sendResponse);
    return true; // async response
  }

  if (popupMessage.type === 'SIGN_IN') {
    void chrome.tabs.create({ url: popupMessage.url });
    sendResponse({ ok: true });
    return false;
  }

  if (popupMessage.type === 'ENABLE_ON_THIS_SITE') {
    void (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url) {
          sendResponse({ ok: false, error: 'Could not read the current tab URL.' });
          return;
        }
        const origin = new URL(tab.url).origin;
        const granted = await chrome.permissions.request({ origins: [origin + '/*'] });
        if (granted) {
          await chrome.scripting.executeScript({
            target: { tabId: popupMessage.tabId },
            files: ['content/content.js'],
          });
        }
        sendResponse({ ok: granted });
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : 'Failed to enable.',
        });
      }
    })();
    return true; // async response
  }

  return false;
});
