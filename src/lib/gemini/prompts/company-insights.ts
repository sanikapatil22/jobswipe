import { sanitizePromptInput } from '../sanitize';

export function buildCompanyInsightsPrompt(input: {
  companyName: string;
  role: string;
  description: string;
  requirements: string[];
  userSkills: string[];
}): string {
  const company = sanitizePromptInput(input.companyName, 200);
  const role = sanitizePromptInput(input.role, 200);

  return `You are a recruiting researcher who prepares candidates for interviews at ${company}.
Build an accurate, role-specific briefing pack for a candidate applying to:
Role: ${role} at ${company}
Job Description & Requirements: ${sanitizePromptInput(input.description, 5000)} | ${JSON.stringify(input.requirements || [])}
Candidate Current Stack: ${JSON.stringify(input.userSkills || [])}

Generate a JSON object matching this exact structure:
{
  "companyName": "${company}",
  "role": "${role}",
  "overview": "2-3 sentence overview of what ${company} does, its product focus, and what this role will actually do day-to-day",
  "interviewProcess": [
    "5-7 realistic interview stages for this role at ${company}, e.g. recruiter screen, technical phone screen, take-home, onsite rounds, behavioral loop — with 1 line of what each tests"
  ],
  "sampleQuestions": [
    "10-12 real-world questions this role would actually be asked at ${company} — mix of technical (based on the job description's stack), system design (based on ${company}'s architecture), and behavioral questions"
  ],
  "keyProductInsights": [
    "5-6 critical product, engineering culture, or architectural insights about ${company} — cite real products, engineering blog themes, and how the role plugs into them"
  ],
  "techStack": [
    "8-10 specific technologies, frameworks, and tools from ${company}'s stack that appear in this job description or are publicly known"
  ],
  "prepTips": [
    "5-6 actionable, specific preparation tips for THIS role at ${company} — what to study, what to build, what to prepare stories about"
  ]
}

Ground everything in the actual job description first, then public knowledge of ${company}. Questions must be specific to ${company}'s products and engineering culture — never generic.`;
}

export function buildStrictCompanyInsightsPrompt(input: {
  companyName: string;
  role: string;
  description: string;
  requirements: string[];
  userSkills: string[];
}): string {
  return `${buildCompanyInsightsPrompt(input)}

IMPORTANT: Respond with ONLY valid JSON matching the schema exactly. No markdown fences, no commentary. sampleQuestions must contain at least 8 questions.`;
}
