export type ApplicationStatus =
  | 'SAVED'
  | 'DISCARDED'
  | 'APPLIED'
  | 'INTERVIEWING'
  | 'OFFER'
  | 'REJECTED';

export type RoadmapStatus = 'PENDING' | 'GENERATING' | 'READY' | 'FAILED';

export type UrgencyLevel = 'Tomorrow' | 'This Week' | 'Later';

export type WorkTypeLabel = 'Remote' | 'Hybrid' | 'Onsite';

export interface Job {
  id: string;
  companyName: string;
  companyLogo: string;
  role: string;
  description: string;
  descriptionHTML?: string;
  requirements: string[];
  salary: string;
  location: string;
  workType: WorkTypeLabel;
  deadline: string;
  applyUrl: string;
  tags: string[];
  companySize: string;
  urgencyLevel: UrgencyLevel;
  staticMatchScore: number;
  staticWhyYou: string;
  missingSkills?: string[];
  postedDate?: string;
  companySlug?: string;
  ats?: 'greenhouse' | 'lever';
  jobId?: string;
}

export interface UserExperience {
  company: string;
  role: string;
  duration: string;
  bullets: string[];
}

export interface UserPreferences {
  university?: string;
  graduationYear?: string;
  gpa?: string;
  targetLocations?: string[];
  minSalary?: number;
  experiences?: UserExperience[];
  rawResumeText?: string;
  parsedSummary?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  university: string;
  graduationYear: string;
  gpa: string;
  targetRoles: string[];
  targetLocations: string[];
  minSalary: number;
  skills: string[];
  experiences: UserExperience[];
  rawResumeText: string;
  parsedSummary: string;
  atsScore: number;
  resumeUrl?: string | null;
}

export interface RoadmapTask {
  id: string;
  title: string;
  completed: boolean;
  category: 'Coding' | 'System Design' | 'Behavioral' | 'Domain Knowledge';
}

export interface RoadmapStep {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  category: 'Technical' | 'Behavioral' | 'System Design' | 'Company Focus';
  estimatedMinutes: number;
  completed: boolean;
  tasks: RoadmapTask[];
  resources: {
    title: string;
    url: string;
    type: 'article' | 'video' | 'practice';
  }[];
}

export interface AIRoadmap {
  companyName: string;
  role: string;
  overallFocus: string;
  steps: RoadmapStep[];
  sampleQuestions: string[];
  keyProductInsights: string[];
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  job: Job;
  status: ApplicationStatus;
  appliedAt: string;
  notes?: string;
  matchScore?: number | null;
  whyYouFit?: string | null;
  roadmap?: AIRoadmap | null;
  roadmapStatus: RoadmapStatus;
  roadmapGenerating?: boolean;
}

export interface MockInterviewMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  feedback?: {
    rating: 'Excellent' | 'Good' | 'Needs Improvement';
    score: number;
    pros: string[];
    improvements: string[];
    idealAnswerSnippet: string;
  };
  timestamp: string;
}

export type JobType = 'parse-resume' | 'generate-roadmap' | 'compute-match';

export interface ParseResumePayload {
  userId: string;
  resumeText?: string;
  resumeUrl?: string;
}

export interface GenerateRoadmapPayload {
  applicationId: string;
  userId: string;
}

export interface ComputeMatchPayload {
  userId: string;
  jobIds: string[];
}
