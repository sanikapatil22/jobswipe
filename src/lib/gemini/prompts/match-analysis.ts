import { sanitizePromptInput } from '../sanitize';

export function buildMatchAnalysisPrompt(input: {
  skills: string[];
  parsedSummary: string;
  targetRoles: string[];
  role: string;
  companyName: string;
  requirements: string[];
  tags: string[];
}): string {
  return `You are SwipePrep's AI Match Engine.
Compare candidate profile:
Candidate Skills: ${JSON.stringify(input.skills)}
Candidate Experience Summary: ${sanitizePromptInput(input.parsedSummary || '', 2000)}
Target Roles: ${JSON.stringify(input.targetRoles)}

Job Details:
Role: ${sanitizePromptInput(input.role, 200)} at ${sanitizePromptInput(input.companyName, 200)}
Requirements: ${JSON.stringify(input.requirements)}
Tags: ${JSON.stringify(input.tags)}

Provide JSON with:
- "matchScore": integer from 50 to 99 representing match accuracy %
- "whyYouFit": a concise, compelling 2-sentence explanation highlighting why candidate stands out for this role
- "topSkillGaps": array of 2-3 specific technical skills or topics the candidate should prepare for
- "resumeAdvice": 1 high-impact tip to customize resume for this specific role
`;
}
