import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
  Application,
  AIRoadmap,
  CompanyInsights,
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

function inferWorkType(location: string, rawResponse: unknown): WorkTypeLabel {
  const text = `${location} ${JSON.stringify(rawResponse)}`.toLowerCase();
  if (text.includes('remote')) return 'Remote';
  if (text.includes('hybrid')) return 'Hybrid';
  return 'Onsite';
}

function buildExcerpt(description: string): string {
  const text = description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= 220) return text;
  return `${text.slice(0, 219).trimEnd()}…`;
}

function extractKeywords(title: string, description: string): string[] {
  const words = `${title} ${description}`
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/g)
    .filter((word) => word.length >= 3);
  const stopWords = new Set(['and', 'the', 'for', 'with', 'you', 'will', 'our', 'role', 'team', 'company']);
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const word of words) {
    if (stopWords.has(word) || seen.has(word)) continue;
    seen.add(word);
    tags.push(word);
    if (tags.length >= 8) break;
  }

  return tags;
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
  const title = job.title || job.role;
  const description = job.description || buildExcerpt(job.descriptionHTML || '');
  const requirements = job.requirements?.length ? job.requirements : [];
  const tags = job.tags?.length ? job.tags : extractKeywords(title, description);
  const heuristic = computeHeuristicMatch([], tags, requirements);
  const firstPublished = job.firstPublished || job.updatedAtSource || job.createdAt;
  const deadline = job.deadline || new Date(firstPublished.getTime() + 1000 * 60 * 60 * 24 * 21);
  return {
    id: job.id,
    companyName: job.companyName,
    companyLogo: job.companyLogo || '',
    role: title,
    description,
    descriptionHTML: job.descriptionHTML,
    requirements,
    salary: job.salary || 'Not disclosed',
    location: job.location,
    workType: inferWorkType(job.location, job.rawResponse),
    deadline: deadline.toISOString().slice(0, 10),
    applyUrl: job.applyUrl,
    tags,
    companySize: job.companySize || job.companyName,
    urgencyLevel: computeUrgency(deadline),
    staticMatchScore: match?.matchScore ?? heuristic.matchScore,
    staticWhyYou: match?.whyYouFit ?? heuristic.whyYouFit,
    missingSkills: match?.missingSkills ?? heuristic.missingSkills,
    postedDate: firstPublished.toISOString().slice(0, 10),
    companySlug: job.companySlug,
    ats: (job.ats || 'GREENHOUSE').toLowerCase() as 'greenhouse' | 'lever',
    jobId: job.jobId,
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
    insights: (app.insights as CompanyInsights | null) || null,
    insightsStatus: (app.insightsStatus || 'PENDING') as Application['insightsStatus'],
    insightsGenerating: app.insightsStatus === 'GENERATING',
  };
}

export type { ApplicationStatus, RoadmapStatus };
