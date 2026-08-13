import { z } from 'zod';

export const resumeParseSchema = z.object({
  name: z.string().min(1).default('Candidate'),
  university: z.string().default('University'),
  graduationYear: z.string().default('N/A'),
  gpa: z.string().default('N/A'),
  skills: z.array(z.string()).default([]),
  targetRoles: z.array(z.string()).default([]),
  parsedSummary: z.string().default(''),
  atsScore: z.number().int().min(0).max(100),
  experiences: z
    .array(
      z.object({
        company: z.string(),
        role: z.string(),
        duration: z.string(),
        bullets: z.array(z.string()).default([]),
      })
    )
    .default([]),
});

export const matchAnalysisSchema = z.object({
  matchScore: z.number().int().min(0).max(100),
  whyYouFit: z.string().min(1),
  topSkillGaps: z.array(z.string()).default([]),
  resumeAdvice: z.string().default(''),
});

export const roadmapTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean().default(false),
  category: z.enum(['Coding', 'System Design', 'Behavioral', 'Domain Knowledge']).catch('Coding'),
});

export const roadmapStepSchema = z.object({
  id: z.string(),
  stepNumber: z.number().int(),
  title: z.string(),
  subtitle: z.string(),
  category: z.enum(['Technical', 'Behavioral', 'System Design', 'Company Focus']).catch('Technical'),
  estimatedMinutes: z.number().int(),
  completed: z.boolean().default(false),
  tasks: z.array(roadmapTaskSchema).min(1),
  resources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
        type: z.enum(['article', 'video', 'practice']).catch('article'),
      })
    )
    .default([]),
});

export const roadmapSchema = z.object({
  companyName: z.string(),
  role: z.string(),
  overallFocus: z.string(),
  steps: z.array(roadmapStepSchema).min(1).max(6),
  sampleQuestions: z.array(z.string()).default([]),
  keyProductInsights: z.array(z.string()).default([]),
});

export const companyInsightsSchema = z.object({
  companyName: z.string(),
  role: z.string(),
  overview: z.string(),
  interviewProcess: z.array(z.string()).default([]),
  sampleQuestions: z.array(z.string()).default([]),
  keyProductInsights: z.array(z.string()).default([]),
  techStack: z.array(z.string()).default([]),
  prepTips: z.array(z.string()).default([]),
});

export const interviewFeedbackSchema = z.object({
  rating: z.enum(['Excellent', 'Good', 'Needs Improvement']).catch('Good'),
  score: z.number().int().min(0).max(100),
  pros: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  idealAnswerSnippet: z.string().default(''),
});

export type ResumeParseResult = z.infer<typeof resumeParseSchema>;
export type MatchAnalysisResult = z.infer<typeof matchAnalysisSchema>;
export type RoadmapResult = z.infer<typeof roadmapSchema>;
export type CompanyInsightsResult = z.infer<typeof companyInsightsSchema>;
export type InterviewFeedback = z.infer<typeof interviewFeedbackSchema>;
