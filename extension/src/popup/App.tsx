import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Flame,
  Globe,
  Loader2,
  LogIn,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import { api, getApiBase } from '../api/client';
import type {
  AutofillProfile,
  AutofillResult,
  DetectedJob,
  LookupJob,
  TailoredResumeResponse,
} from '../types';

type View =
  | { name: 'loading' }
  | { name: 'signin' }
  | { name: 'server-down'; message: string }
  | { name: 'unsupported' }
  | { name: 'no-job' }
  | {
      name: 'matched';
      generating: boolean;
      matchError: string | null;
    }
  | { name: 'not-matched' }
  | { name: 'autofill'; result: AutofillResult }
  | { name: 'tailoring' }
  | { name: 'tailored'; data: TailoredResumeResponse };

const LABELS: Record<string, string> = {
  FIRST_NAME: 'First name',
  LAST_NAME: 'Last name',
  FULL_NAME: 'Full name',
  EMAIL: 'Email',
  PHONE: 'Phone',
  ADDRESS: 'Address',
  CITY: 'City',
  STATE: 'State',
  COUNTRY: 'Country',
  ZIP: 'ZIP / postal code',
  UNIVERSITY: 'University',
  DEGREE: 'Degree',
  MAJOR: 'Major',
  GRADUATION_YEAR: 'Graduation year',
  LINKEDIN: 'LinkedIn',
  GITHUB: 'GitHub',
  PORTFOLIO: 'Portfolio / website',
  COMPANY: 'Company',
  JOB_TITLE: 'Job title',
  YEARS_EXPERIENCE: 'Years of experience',
  RESUME: 'Resume',
  QUESTION: 'Application question',
  OTHER: 'Unknown field',
};

function sendToBackground(message: unknown): Promise<unknown> {
  return chrome.runtime.sendMessage(message);
}

function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-logo">
        <Flame size={18} strokeWidth={2.6} />
      </div>
      <div>
        <div className="app-title">SwipePrep</div>
        <div className="app-subtitle">Discover • Apply • Prepare with AI</div>
      </div>
    </header>
  );
}

function MatchBadge({ job }: { job: LookupJob }) {
  if (job.matchScore == null) {
    return (
      <div>
        <div className="match-badge">
          <Sparkles size={14} />
          <span>Match pending</span>
        </div>
        <div className="match-caption">AI analysis running…</div>
      </div>
    );
  }
  return (
    <div>
      <div className="match-badge">
        <Sparkles size={14} />
        <span>Job Match {job.matchScore}%</span>
      </div>
      <div className="match-caption">
        {job.matchSource === 'gemini' ? 'AI match analysis' : 'Estimated match'}
      </div>
    </div>
  );
}

function SpinnerState({ label }: { label: string }) {
  return (
    <div className="state-view">
      <div className="state-icon brand">
        <Loader2 size={22} className="spinner" />
      </div>
      <p className="body-copy">{label}</p>
    </div>
  );
}

export function App() {
  const [view, setView] = useState<View>({ name: 'loading' });
  const [profile, setProfile] = useState<AutofillProfile | null>(null);
  const [detected, setDetected] = useState<DetectedJob | null>(null);
  const [job, setJob] = useState<LookupJob | null>(null);
  const [tabId, setTabId] = useState<number | null>(null);
  const [contentScriptPresent, setContentScriptPresent] = useState(false);
  const [hasForm, setHasForm] = useState(false);
  const pollTimer = useRef<number | null>(null);

  const clearPoll = useCallback(() => {
    if (pollTimer.current != null) {
      window.clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  useEffect(() => () => clearPoll(), [clearPoll]);

  const startMatchPolling = useCallback(
    (jobId: string, aiJobId: string) => {
      setView((prev) =>
        prev.name === 'matched' ? { ...prev, generating: true, matchError: null } : prev
      );
      let attempts = 0;
      const tick = async () => {
        attempts += 1;
        try {
          const status = await api.matchStatus(aiJobId, jobId);
          if (status.status === 'COMPLETED' && status.matchScore != null) {
            setJob((prev) =>
              prev
                ? {
                    ...prev,
                    matchScore: status.matchScore ?? null,
                    matchSource: 'gemini',
                    whyYouFit: status.whyYouFit ?? prev.whyYouFit,
                  }
                : prev
            );
            setView((prev) =>
              prev.name === 'matched'
                ? { ...prev, generating: false, matchError: null }
                : prev
            );
            return;
          }
          if (status.status === 'FAILED') {
            setView((prev) =>
              prev.name === 'matched'
                ? { ...prev, generating: false, matchError: 'AI match analysis failed.' }
                : prev
            );
            return;
          }
        } catch {
          // transient — keep polling
        }
        if (attempts >= 40) {
          setView((prev) =>
            prev.name === 'matched'
              ? { ...prev, generating: false, matchError: 'Match analysis timed out.' }
              : prev
          );
          return;
        }
        pollTimer.current = window.setTimeout(tick, 3000);
      };
      void tick();
    },
    [clearPoll]
  );

  const init = useCallback(async () => {
    setView({ name: 'loading' });
    clearPoll();

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTabId = tab?.id ?? null;
      setTabId(activeTabId);

      let popupState: { detected: DetectedJob | null; hasForm: boolean; contentScriptPresent: boolean };
      if (activeTabId != null) {
        try {
          popupState = (await sendToBackground({
            type: 'GET_STATE',
            tabId: activeTabId,
          })) as typeof popupState;
        } catch {
          popupState = { detected: null, hasForm: false, contentScriptPresent: false };
        }
      } else {
        popupState = { detected: null, hasForm: false, contentScriptPresent: false };
      }

      setDetected(popupState.detected);
      setHasForm(popupState.hasForm);
      setContentScriptPresent(popupState.contentScriptPresent);

      const profileResponse = await api.getProfile();
      setProfile(profileResponse.profile);

      if (!popupState.contentScriptPresent) {
        setView({ name: 'unsupported' });
        return;
      }

      if (!popupState.detected) {
        setView({ name: 'no-job' });
        return;
      }

      const lookup = await api.lookupJob(popupState.detected);
      setJob(lookup.job);
      if (lookup.matched && lookup.job) {
        setView({ name: 'matched', generating: false, matchError: null });
      } else {
        setView({ name: 'not-matched' });
      }
    } catch (error) {
      const err = error as Error & { status?: number; code?: string };
      if (err.code === 'UNAUTHENTICATED' || err.status === 401) {
        setView({ name: 'signin' });
      } else {
        setView({
          name: 'server-down',
          message: err.message || 'Could not reach the SwipePrep server.',
        });
      }
    }
  }, [clearPoll]);

  useEffect(() => {
    void init();
  }, [init]);

  const handleSignIn = async () => {
    const base = await getApiBase();
    await sendToBackground({ type: 'SIGN_IN', url: `${base}/login` });
  };

  const handleEnableSite = async () => {
    if (tabId == null) return;
    const response = (await sendToBackground({
      type: 'ENABLE_ON_THIS_SITE',
      tabId,
    })) as { ok: boolean; error?: string };
    if (response.ok) {
      setContentScriptPresent(true);
      void init();
    }
  };

  const handleAddToSwipePrep = async () => {
    if (!detected) return;
    setView({ name: 'loading' });
    try {
      const response = await api.saveJob(detected);
      setJob(response.job);
      if (response.aiJobId) {
        startMatchPolling(response.job.id, response.aiJobId);
      } else {
        setView({ name: 'matched', generating: false, matchError: null });
      }
    } catch (error) {
      const err = error as Error & { status?: number };
      setView({
        name: 'server-down',
        message: err.status === 401 ? 'Please sign in first.' : err.message,
      });
    }
  };

  const handleAutofill = async () => {
    if (!profile || tabId == null || !job) return;
    setView({ name: 'loading' });
    try {
      const result = (await sendToBackground({
        type: 'AUTOFILL',
        tabId,
        profile,
      })) as AutofillResult;
      setView({ name: 'autofill', result });
    } catch {
      setView({ name: 'server-down', message: 'Autofill failed. Reload the page and try again.' });
    }
  };

  const handleGenerateMatch = async () => {
    if (!job) return;
    try {
      const response = await api.requestMatch(job.id);
      if (response.status === 'GENERATING' && response.aiJobId) {
        startMatchPolling(job.id, response.aiJobId);
      } else {
        setView({ name: 'matched', generating: false, matchError: null });
      }
    } catch {
      setView((prev) =>
        prev.name === 'matched'
          ? { ...prev, matchError: 'Could not start match analysis.' }
          : prev
      );
    }
  };

  const handleTailor = async () => {
    if (!job) return;
    setView({ name: 'tailoring' });
    try {
      const data = await api.tailorResume(job.id);
      setView({ name: 'tailored', data });
    } catch (error) {
      const err = error as Error & { code?: string };
      setView({
        name: 'server-down',
        message:
          err.code === 'NO_RESUME'
            ? 'Upload and parse a resume in SwipePrep first.'
            : err.message,
      });
    }
  };

  const handleDownload = () => {
    if (view.name !== 'tailored') return;
    const blob = new Blob([view.data.tailoredResume], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `tailored-resume-${job?.companyName ?? 'swipeprep'}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handleCopy = async () => {
    if (view.name !== 'tailored') return;
    try {
      await navigator.clipboard.writeText(view.data.tailoredResume);
    } catch {
      // clipboard unavailable — user can still download
    }
  };

  const openInSwipePrep = async () => {
    const base = await getApiBase();
    await sendToBackground({ type: 'SIGN_IN', url: `${base}/companies` });
  };

  const matchedView = view.name === 'matched' ? view : null;

  return (
    <>
      <AppHeader />
      <main className="app-body">
        {view.name === 'loading' && <SpinnerState label="Connecting to SwipePrep…" />}

        {view.name === 'signin' && (
          <div className="state-view">
            <div className="state-icon">
              <LogIn size={22} />
            </div>
            <p className="body-copy" style={{ fontWeight: 900, color: 'var(--slate-900)' }}>
              You're not signed in.
            </p>
            <p className="body-copy">
              Sign in to SwipePrep to see your match score and autofill applications.
            </p>
            <button className="btn btn-primary" onClick={() => void handleSignIn()}>
              <LogIn size={14} /> Sign in to SwipePrep
            </button>
            <button className="btn btn-ghost" onClick={() => void init()}>
              <RefreshCw size={12} /> Check again
            </button>
          </div>
        )}

        {view.name === 'server-down' && (
          <div className="state-view">
            <div className="state-icon warn">
              <AlertTriangle size={22} />
            </div>
            <p className="body-copy" style={{ fontWeight: 900, color: 'var(--slate-900)' }}>
              SwipePrep unreachable
            </p>
            <p className="body-copy">{view.message}</p>
            <button className="btn btn-primary" onClick={() => void init()}>
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        )}

        {view.name === 'unsupported' && (
          <div className="state-view">
            <div className="state-icon">
              <Globe size={22} />
            </div>
            <p className="body-copy" style={{ fontWeight: 900, color: 'var(--slate-900)' }}>
              Open a job application page
            </p>
            <p className="body-copy">
              SwipePrep Autofill works on <strong>Greenhouse</strong> and{' '}
              <strong>Lever</strong> application pages automatically, plus a generic
              detector for other sites you enable.
            </p>
            <button className="btn btn-primary" onClick={() => void handleEnableSite()}>
              <Wrench size={14} /> Enable on this site
            </button>
            {hasForm && (
              <p className="micro">
                This page looks like it has an application form — enabling it here should
                detect the job.
              </p>
            )}
          </div>
        )}

        {view.name === 'no-job' && (
          <div className="state-view">
            <div className="state-icon warn">
              <AlertTriangle size={22} />
            </div>
            <p className="body-copy" style={{ fontWeight: 900, color: 'var(--slate-900)' }}>
              Couldn't detect a job on this page.
            </p>
            <p className="body-copy">
              Open a specific job posting on Greenhouse or Lever — SwipePrep Autofill
              will pick it up automatically.
            </p>
            <button className="btn btn-secondary" onClick={() => void init()}>
              <RefreshCw size={14} /> Scan again
            </button>
          </div>
        )}

        {view.name === 'matched' && job && detected && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div className="job-company">{job.companyName}</div>
                <div className="job-title">{job.title}</div>
                {job.location ? <div className="micro" style={{ marginTop: 3 }}>{job.location}</div> : null}
              </div>
              <MatchBadge job={job} />
            </div>

            {job.matchSource === 'heuristic' && job.whyYouFit && (
              <div className="card-flat">
                <div className="eyebrow" style={{ marginBottom: 4 }}>Why you fit</div>
                <p className="body-copy">{job.whyYouFit}</p>
              </div>
            )}

            {matchedView?.generating && (
              <div className="card-flat" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="pulse-dot" />
                <span className="micro">Analyzing your profile with AI…</span>
              </div>
            )}
            {matchedView?.matchError && (
              <div className="card-flat" style={{ background: 'var(--amber-50)' }}>
                <p className="micro" style={{ color: 'var(--amber-900)' }}>{matchedView.matchError}</p>
              </div>
            )}

            <div className="btn-row">
              <button className="btn btn-primary" onClick={() => void handleAutofill()}>
                <Zap size={14} /> Autofill Application
              </button>
            </div>

            <div className="btn-row">
              {profile?.tailoredResumeAvailable && (
                <button className="btn btn-secondary" onClick={() => void handleTailor()}>
                  <FileText size={14} /> Tailored resume
                </button>
              )}
              {!job.saved && (
                <button className="btn btn-secondary" onClick={() => void handleAddToSwipePrep()}>
                  <CheckCircle2 size={14} /> Save to SwipePrep
                </button>
              )}
            </div>

            {job.saved && (
              <span className="chip green" style={{ alignSelf: 'flex-start' }}>
                <CheckCircle2 size={11} style={{ marginRight: 4 }} /> Saved to SwipePrep
              </span>
            )}
            {job.saved && job.matchSource === 'heuristic' && !matchedView?.generating && (
              <button className="btn btn-ghost" onClick={() => void handleGenerateMatch()}>
                <Sparkles size={12} /> Run AI match analysis
              </button>
            )}
          </div>
        )}

        {view.name === 'not-matched' && detected && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div className="eyebrow">On this page</div>
              <div className="job-company" style={{ marginTop: 4 }}>{detected.company || 'Unknown company'}</div>
              <div className="job-title">{detected.title}</div>
            </div>
            <div className="card-flat" style={{ background: 'var(--amber-50)' }}>
              <p className="body-copy" style={{ color: 'var(--amber-900)' }}>
                This job isn't in SwipePrep yet.
              </p>
            </div>
            <button className="btn btn-dark" onClick={() => void handleAddToSwipePrep()}>
              <CheckCircle2 size={14} /> Add to SwipePrep
            </button>
            {!profile?.tailoredResumeAvailable && (
              <p className="micro">
                Tip: upload a resume in SwipePrep to unlock tailored resumes and AI match
                scores.
              </p>
            )}
          </div>
        )}

        {view.name === 'autofill' && (
          <AutofillResultView
            result={view.result}
            job={job}
            onDone={() => setView({ name: 'matched', generating: false, matchError: null })}
            onTailor={profile?.tailoredResumeAvailable ? () => void handleTailor() : undefined}
            onOpenSwipePrep={() => void openInSwipePrep()}
          />
        )}

        {view.name === 'tailoring' && (
          <SpinnerState label="Tailoring your resume with AI…" />
        )}

        {view.name === 'tailored' && (
          <TailoredView
            data={view.data}
            onCopy={() => void handleCopy()}
            onDownload={handleDownload}
            onDone={() => setView({ name: 'matched', generating: false, matchError: null })}
          />
        )}
      </main>
      <footer className="app-footer">
        <div className="safety-note">
          <ShieldCheck size={12} />
          <span>Never submitted automatically — review before you apply.</span>
        </div>
      </footer>
    </>
  );
}

function AutofillResultView({
  result,
  job,
  onDone,
  onTailor,
  onOpenSwipePrep,
}: {
  result: AutofillResult;
  job: LookupJob | null;
  onDone: () => void;
  onTailor?: () => void;
  onOpenSwipePrep: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="state-icon ok" style={{ width: 34, height: 34, borderRadius: 10 }}>
            <CheckCircle2 size={17} />
          </div>
          <div>
            <div className="job-company" style={{ fontSize: 13 }}>
              Autofill complete
            </div>
            <div className="micro">
              {result.filledCount} filled · {result.reviewCount} need review
            </div>
          </div>
        </div>
        {job && (
          <button className="btn btn-ghost" onClick={onOpenSwipePrep} style={{ alignSelf: 'flex-start' }}>
            <ExternalLink size={11} /> View resume in SwipePrep
          </button>
        )}
      </div>

      {result.filled.length > 0 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="eyebrow" style={{ marginBottom: 2 }}>Filled</div>
          {result.filled.map((fill, index) => (
            <div key={index} className="check-item filled">
              <CheckCircle2 size={14} className="icon" />
              <span className="check-label">{LABELS[fill.fieldType] ?? fill.label}</span>
            </div>
          ))}
        </div>
      )}

      {result.needsReview.length > 0 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="eyebrow" style={{ marginBottom: 2 }}>Needs review</div>
          {result.needsReview.slice(0, 10).map((fill, index) => (
            <div key={index} className="check-item review">
              <AlertTriangle size={14} className="icon" />
              <span className="check-label">
                {LABELS[fill.fieldType] ?? fill.label}
                {fill.reason ? <span className="check-note">{fill.reason}</span> : null}
              </span>
            </div>
          ))}
          {result.needsReview.length > 10 && (
            <p className="micro">…and {result.needsReview.length - 10} more.</p>
          )}
        </div>
      )}

      {result.notes.map((note, index) => (
        <p key={index} className="micro">{note}</p>
      ))}

      <div className="btn-row">
        {onTailor && (
          <button className="btn btn-secondary" onClick={onTailor}>
            <FileText size={14} /> Tailored resume
          </button>
        )}
        <button className="btn btn-dark" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}

function TailoredView({
  data,
  onCopy,
  onDownload,
  onDone,
}: {
  data: TailoredResumeResponse;
  onCopy: () => void;
  onDownload: () => void;
  onDone: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="state-icon ok" style={{ width: 34, height: 34, borderRadius: 10 }}>
            <CheckCircle2 size={17} />
          </div>
          <div>
            <div className="job-company" style={{ fontSize: 13 }}>Tailored resume ready</div>
            <div className="micro">Rewritten for this exact job by Gemini</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {data.keywords.slice(0, 8).map((keyword) => (
            <span key={keyword} className="chip indigo">{keyword}</span>
          ))}
        </div>

        {data.focusNotes && (
          <p className="body-copy" style={{ fontSize: 11 }}>
            {data.focusNotes}
          </p>
        )}

        <div className="resume-preview">{data.tailoredResume}</div>

        <div className="btn-row">
          <button className="btn btn-secondary" onClick={onCopy}>
            <Copy size={13} /> Copy
          </button>
          <button className="btn btn-secondary" onClick={onDownload}>
            <Download size={13} /> Download .txt
          </button>
        </div>

        <p className="micro">
          Upload the tailored resume to the application form manually — browsers don't
          allow extensions to attach files for you.
        </p>
      </div>
      <button className="btn btn-dark" onClick={onDone}>Done</button>
    </div>
  );
}
