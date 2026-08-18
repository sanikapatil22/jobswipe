/** Job detected on the current page by a content-script adapter. */
export interface DetectedJob {
  url: string;
  title?: string;
  company?: string;
  ats?: 'greenhouse' | 'lever';
  description?: string;
  location?: string;
  /** 0..1 — how confident the detector is about the title/company. */
  confidence: number;
}

/** Normalized field types the autofill engine understands. */
export const FIELD_TYPES = [
  'FIRST_NAME',
  'LAST_NAME',
  'FULL_NAME',
  'EMAIL',
  'PHONE',
  'ADDRESS',
  'CITY',
  'STATE',
  'COUNTRY',
  'ZIP',
  'UNIVERSITY',
  'DEGREE',
  'MAJOR',
  'GRADUATION_YEAR',
  'LINKEDIN',
  'GITHUB',
  'PORTFOLIO',
  'COMPANY',
  'JOB_TITLE',
  'YEARS_EXPERIENCE',
  'RESUME',
  'QUESTION',
  'OTHER',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export type Confidence = 'high' | 'medium' | 'low';

export interface FieldFill {
  fieldType: FieldType;
  label: string;
  confidence: Confidence;
  value?: string;
  /** Why the field was left for review (empty when filled). */
  reason?: string;
  /** Content-script internal: the DOM element that was handled. */
  element?: HTMLElement | null;
}

export interface AutofillResult {
  filled: FieldFill[];
  needsReview: FieldFill[];
  filledCount: number;
  reviewCount: number;
  notes: string[];
}

/** Minimum user data the extension may see — never the raw resume text. */
export interface AutofillProfile {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  university: string;
  graduationYear: string;
  gpa: string;
  skills: string[];
  experiences: Array<{ company: string; role: string; duration: string }>;
  atsScore: number;
  resumeAvailable: boolean;
  tailoredResumeAvailable: boolean;
}

/** Job payload returned by the backend (reuses SwipePrep scoring semantics). */
export interface LookupJob {
  id: string;
  companyName: string;
  title: string;
  location: string;
  applyUrl: string;
  matchScore: number | null;
  matchSource: 'gemini' | 'heuristic' | null;
  whyYouFit: string | null;
  saved: boolean;
  applicationId: string | null;
}

export interface LookupResponse {
  ok: boolean;
  matched: boolean;
  job: LookupJob | null;
  detected?: {
    url: string;
    title: string | null;
    company: string | null;
    ats: string | null;
  };
}

export interface ProfileResponse {
  ok: boolean;
  profile: AutofillProfile;
}

export interface SaveJobResponse {
  ok: boolean;
  job: LookupJob;
  aiJobId: string | null;
  message: string;
}

export interface MatchResponse {
  ok: boolean;
  job?: LookupJob;
  jobId?: string;
  aiJobId: string | null;
  status: 'READY' | 'GENERATING';
}

export interface MatchStatusResponse {
  ok: boolean;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | string;
  error?: string | null;
  matchScore?: number | null;
  whyYouFit?: string | null;
  source?: string | null;
  jobCompany?: string | null;
  jobTitle?: string | null;
}

export interface TailoredResumeResponse {
  ok: boolean;
  jobId: string;
  tailoredResume: string;
  keywords: string[];
  focusNotes: string;
}

export interface ApiError {
  ok: false;
  error: string;
  message: string;
}

// ---- message protocol -------------------------------------------------------

/** content script → background */
export type ContentMessage =
  | { type: 'JOB_DETECTED'; detected: DetectedJob | null; hasForm: boolean }
  | { type: 'AUTOFILL_UPDATED'; result: AutofillResult }
  | { type: 'PONG' };

/** background → content script */
export type ContentCommand =
  | { type: 'PING' }
  | { type: 'GET_DETECTION' }
  | { type: 'AUTOFILL'; profile: AutofillProfile };

/** popup → background */
export type PopupMessage =
  | { type: 'GET_STATE'; tabId: number }
  | { type: 'AUTOFILL'; tabId: number; profile: AutofillProfile }
  | { type: 'SIGN_IN'; url: string }
  | { type: 'ENABLE_ON_THIS_SITE'; tabId: number };

export interface PopupStateResponse {
  detected: DetectedJob | null;
  hasForm: boolean;
  contentScriptPresent: boolean;
}
