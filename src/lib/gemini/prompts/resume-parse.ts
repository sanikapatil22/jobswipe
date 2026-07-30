import { wrapDelimited } from '../sanitize';

export function buildResumeParsePrompt(resumeText: string): string {
  return `You are an expert AI Resume Parser and Career Advisor. Analyze the following resume text and extract structured information into JSON.
${wrapDelimited('Resume Text', resumeText)}

Return JSON with:
- "name": candidate name or "Candidate"
- "university": university name or "University"
- "graduationYear": graduation year (e.g. "2026")
- "gpa": GPA if listed or "N/A"
- "skills": array of technical skills, frameworks, languages, and tools found (10-15 keywords)
- "targetRoles": suggested top 3 target job titles matching this profile
- "parsedSummary": 2-sentence executive summary of strengths and core stack
- "atsScore": an integer score from 60 to 98 representing ATS quality, structure, and keyword density
- "experiences": array of objects with "company", "role", "duration", and "bullets" (array of strings)
`;
}

export function buildStrictResumeParsePrompt(resumeText: string): string {
  return `${buildResumeParsePrompt(resumeText)}

IMPORTANT: Respond with ONLY valid JSON matching the schema exactly. No markdown fences, no commentary.`;
}
