import type {
  ApiError,
  DetectedJob,
  LookupResponse,
  MatchResponse,
  MatchStatusResponse,
  ProfileResponse,
  SaveJobResponse,
  TailoredResumeResponse,
} from '../types';

/** Injected at build time from EXTENSION_API_URL (see build.mjs). */
declare const __API_BASE_URL__: string;

const BUILD_TIME_BASE: string =
  typeof __API_BASE_URL__ !== 'undefined' ? __API_BASE_URL__ : 'http://localhost:3000';

/** Optional runtime override (chrome.storage.local['apiBaseUrl']). */
export async function getApiBase(): Promise<string> {
  try {
    const stored = await chrome.storage.local.get('apiBaseUrl');
    if (typeof stored.apiBaseUrl === 'string' && stored.apiBaseUrl.trim()) {
      return stored.apiBaseUrl.replace(/\/+$/, '');
    }
  } catch {
    // fall back to the build-time default
  }
  return BUILD_TIME_BASE;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = await getApiBase();
  const response = await fetch(`${base}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let body: ApiError | null = null;
    try {
      body = (await response.json()) as ApiError;
    } catch {
      body = null;
    }
    const error = body?.error ?? 'HTTP_ERROR';
    const message = body?.message ?? `Request failed (${response.status})`;
    const err = new Error(message) as Error & { status?: number; code?: string };
    err.status = response.status;
    err.code = error;
    throw err;
  }

  return (await response.json()) as T;
}

export const api = {
  /** Verifies the Better Auth session and returns the minimal autofill profile. */
  getProfile(): Promise<ProfileResponse> {
    return request<ProfileResponse>('/api/extension/profile');
  },

  /** Matches the detected job against existing SwipePrep jobs. */
  lookupJob(detected: DetectedJob): Promise<LookupResponse> {
    return request<LookupResponse>('/api/extension/job-lookup', {
      method: 'POST',
      body: JSON.stringify(detected),
    });
  },

  /** Adds the detected job to SwipePrep and enqueues an AI match. */
  saveJob(detected: DetectedJob): Promise<SaveJobResponse> {
    return request<SaveJobResponse>('/api/extension/save-job', {
      method: 'POST',
      body: JSON.stringify(detected),
    });
  },

  /** Returns the stored score or enqueues the existing Gemini compute-match job. */
  requestMatch(jobId: string): Promise<MatchResponse> {
    return request<MatchResponse>('/api/extension/match', {
      method: 'POST',
      body: JSON.stringify({ jobId }),
    });
  },

  /** Polls the AiJob that computes the Gemini match score. */
  matchStatus(aiJobId: string, jobId: string): Promise<MatchStatusResponse> {
    return request<MatchStatusResponse>(
      `/api/extension/match-status?aiJobId=${encodeURIComponent(aiJobId)}&jobId=${encodeURIComponent(jobId)}`
    );
  },

  /** Server-side resume tailoring (reuses the web app's Gemini workflow). */
  tailorResume(jobId: string): Promise<TailoredResumeResponse> {
    return request<TailoredResumeResponse>('/api/extension/tailored-resume', {
      method: 'POST',
      body: JSON.stringify({ jobId }),
    });
  },
};
