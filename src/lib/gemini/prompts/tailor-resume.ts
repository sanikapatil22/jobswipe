import { z } from 'zod';
import { sanitizePromptInput } from '../sanitize';

export const tailoredResumeSchema = z.object({
  tailoredResume: z.string(),
  keywords: z.array(z.string()),
  focusNotes: z.string(),
});

export type TailoredResumeResult = z.infer<typeof tailoredResumeSchema>;

export function buildTailorResumePrompt(input: {
  companyName: string;
  role: string;
  jobDescription: string;
  jobRequirements: string[];
  currentResume: string;
  skills: string[];
}): string {
  const requirementsBlock =
    input.jobRequirements.length > 0
      ? input.jobRequirements.map((r) => `- ${r}`).join('\n')
      : '- (no explicit requirements listed)';

  return `Tailor this resume for a ${sanitizePromptInput(input.role, 300)} role at ${sanitizePromptInput(input.companyName, 300)}.

JOB POSTING:
${sanitizePromptInput(input.jobDescription, 4000) || '(no description available)'}

REQUIREMENTS / KEY WORDS:
${requirementsBlock}

CANDIDATE SKILLS:
${input.skills.join(', ') || '(none listed)'}

CURRENT RESUME:
---
${sanitizePromptInput(input.currentResume, 6000)}
---

Rules:
1. REWRITE the resume for this exact job: reorder and reword skills so the ones this role asks for come first; rewrite experience bullets to echo the job's language (keywords, technologies, responsibilities) using only facts present in the current resume — never fabricate experience, metrics, or skills.
2. Keep it one page, plain-text format (ALL-CAPS section headings, no markdown headers).
3. Add a 2-line "SUMMARY" at the top tailored to this company + role.
4. In "keywords", list the top 8-12 keywords from the job that the candidate should make sure appear.
5. In "focusNotes", give 2-3 sentences on what to emphasize in the interview and what the resume still lacks for this role.

Return the full rewritten resume as the "tailoredResume" string.`;
}
