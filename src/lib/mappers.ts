import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
  Application,
  AIRoadmap,
  Job,
  UrgencyLevel,
  UserPreferences,
  UserProfile,
  WorkTypeLabel,
} from '@/types';
import type {
  Application as DbApplication,
  Job as DbJob,
  User as DbUser,
  WorkType,
  ApplicationStatus,
  RoadmapStatus,
} from '@/generated/prisma/client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function workTypeToLabel(workType: WorkType): WorkTypeLabel {
  switch (workType) {
    case 'REMOTE':
      return 'Remote';
    case 'HYBRID':
      return 'Hybrid';
    default:
      return 'Onsite';
  }
}

export function labelToWorkType(label: WorkTypeLabel | string): WorkType {
  switch (label) {
    case 'Remote':
    case 'REMOTE':
      return 'REMOTE';
    case 'Hybrid':
    case 'HYBRID':
      return 'HYBRID';
    default:
      return 'ONSITE';
  }
}

export function computeUrgency(deadline: Date): UrgencyLevel {
  const now = new Date();
  const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 3600 * 24));
  if (diffDays <= 2) return 'Tomorrow';
  if (diffDays <= 7) return 'This Week';
  return 'Later';
}

export function computeHeuristicMatch(
  skills: string[],
  tags: string[],
  requirements: string[]
): { matchScore: number; whyYouFit: string; missingSkills: string[] } {
  const skillSet = new Set(skills.map((s) => s.toLowerCase()));
  const matched = tags.filter((t) => skillSet.has(t.toLowerCase()));
  const reqTokens = requirements
    .join(' ')
    .split(/[^a-zA-Z0-9+#.]+/)
    .filter((t) => t.length > 2);
  const missingSkills = tags.filter((t) => !skillSet.has(t.toLowerCase())).slice(0, 3);
  const score = Math.min(99, 55 + matched.length * 8 + Math.min(10, reqTokens.filter((t) => skillSet.has(t.toLowerCase())).length));
  const whyYouFit =
    matched.length > 0
      ? `Your experience with ${matched.slice(0, 3).join(', ')} aligns well with this role's stack.`
      : 'Your profile shows transferable skills for this role — review the requirements and tailor your resume.';

  return { matchScore: score, whyYouFit, missingSkills };
}

export function parsePreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== 'object') return {};
  return raw as UserPreferences;
}

export function mapUserToProfile(user: DbUser): UserProfile {
  const prefs = parsePreferences(user.preferences);
  return {
    id: user.id,
    name: user.name || 'Candidate',
    email: user.email,
    university: prefs.university || '',
    graduationYear: prefs.graduationYear || '',
    gpa: prefs.gpa || '',
    targetRoles: user.targetRoles || [],
    targetLocations: prefs.targetLocations || [],
    minSalary: prefs.minSalary ?? 45,
    skills: user.skills || [],
    experiences: prefs.experiences || [],
    rawResumeText: prefs.rawResumeText || '',
    parsedSummary: prefs.parsedSummary || '',
    atsScore: user.atsScore ?? 0,
    resumeUrl: user.resumeUrl,
  };
}

export function mapJobToClient(
  job: DbJob,
  match?: { matchScore?: number | null; whyYouFit?: string | null; missingSkills?: string[] }
): Job {
  const heuristic = computeHeuristicMatch([], job.tags, job.requirements);
  return {
    id: job.id,
    companyName: job.companyName,
    companyLogo: job.companyLogo || '',
    role: job.role,
    description: job.description,
    requirements: job.requirements,
    salary: job.salary || '',
    location: job.location,
    workType: workTypeToLabel(job.workType),
    deadline: job.deadline.toISOString().slice(0, 10),
    applyUrl: job.applyUrl,
    tags: job.tags,
    companySize: job.companySize || '',
    urgencyLevel: computeUrgency(job.deadline),
    staticMatchScore: match?.matchScore ?? heuristic.matchScore,
    staticWhyYou: match?.whyYouFit ?? heuristic.whyYouFit,
    missingSkills: match?.missingSkills ?? heuristic.missingSkills,
  };
}

export function mapApplicationToClient(
  app: DbApplication & { job: DbJob },
  userSkills: string[] = []
): Application {
  const heuristic = computeHeuristicMatch(userSkills, app.job.tags, app.job.requirements);
  const job = mapJobToClient(app.job, {
    matchScore: app.matchScore ?? heuristic.matchScore,
    whyYouFit: app.whyYouFit ?? heuristic.whyYouFit,
    missingSkills: heuristic.missingSkills,
  });

  return {
    id: app.id,
    userId: app.userId,
    jobId: app.jobId,
    job,
    status: app.status as Application['status'],
    appliedAt: (app.appliedAt || app.createdAt).toISOString(),
    notes: app.notes || undefined,
    matchScore: app.matchScore,
    whyYouFit: app.whyYouFit,
    roadmap: (app.roadmap as AIRoadmap | null) || null,
    roadmapStatus: app.roadmapStatus as Application['roadmapStatus'],
    roadmapGenerating: app.roadmapStatus === 'GENERATING',
  };
}

export type { ApplicationStatus, RoadmapStatus };
