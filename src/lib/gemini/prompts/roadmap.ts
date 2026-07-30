import { sanitizePromptInput } from '../sanitize';

export function buildRoadmapPrompt(input: {
  companyName: string;
  role: string;
  description: string;
  requirements: string[];
  userSkills: string[];
}): string {
  const company = sanitizePromptInput(input.companyName, 200);
  const role = sanitizePromptInput(input.role, 200);

  return `You are a Principal Software Engineer and Technical Interview Prep Lead at ${company}.
Create a highly structured, 4-step actionable preparation roadmap for a candidate applying to:
Role: ${role} at ${company}
Job Description & Requirements: ${sanitizePromptInput(input.description, 4000)} | ${JSON.stringify(input.requirements || [])}
Candidate Current Stack: ${JSON.stringify(input.userSkills || [])}

Generate a JSON object matching this exact structure:
{
  "companyName": "${company}",
  "role": "${role}",
  "overallFocus": "1 short summary line detailing the main interview focus for ${company}",
  "steps": [
    {
      "id": "step_1",
      "stepNumber": 1,
      "title": "Phase 1 Title",
      "subtitle": "Short Phase Subtitle",
      "category": "Technical",
      "estimatedMinutes": 45,
      "completed": false,
      "tasks": [
        { "id": "task_1_1", "title": "Specific bite-sized prep task", "completed": false, "category": "Coding" },
        { "id": "task_1_2", "title": "Specific bite-sized prep task", "completed": false, "category": "System Design" }
      ],
      "resources": [
        { "title": "Resource title", "url": "https://example.com", "type": "article" }
      ]
    }
  ],
  "sampleQuestions": [
    "4 real-world technical or behavioral questions commonly asked during ${company} interviews for this role"
  ],
  "keyProductInsights": [
    "3 critical product, engineering culture, or architectural insights about ${company}"
  ]
}

Produce exactly 4 steps with 3-4 actionable tasks each.
`;
}

export function buildStrictRoadmapPrompt(input: {
  companyName: string;
  role: string;
  description: string;
  requirements: string[];
  userSkills: string[];
}): string {
  return `${buildRoadmapPrompt(input)}

IMPORTANT: Respond with ONLY valid JSON matching the schema exactly. No markdown fences, no commentary. Every step must include id, stepNumber, title, subtitle, category, estimatedMinutes, completed, tasks, and resources.`;
}
