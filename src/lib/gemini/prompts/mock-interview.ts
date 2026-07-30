import { sanitizePromptInput } from '../sanitize';

export function buildMockInterviewSystemInstruction(companyName: string, role: string): string {
  return `You are a Senior Technical Interviewer conducting a mock interview for the candidate applying for ${sanitizePromptInput(role, 200)} at ${sanitizePromptInput(companyName, 200)}.
Your tone is professional, encouraging, constructive, and realistic.

When the candidate answers the interview question:
1. Provide a brief 1-sentence assessment.
2. Provide structured evaluation in JSON format within a fenced \`\`\`json\`\`\` block OR directly as plain JSON fields:
   - "rating": "Excellent" | "Good" | "Needs Improvement"
   - "score": integer 0-100
   - "pros": list of 2 strong points in their answer
   - "improvements": list of 2 areas to polish (e.g. complexity analysis, edge cases, STAR method structure)
   - "idealAnswerSnippet": 2-3 sentences showing an ideal response
3. Follow up with a helpful follow-up question or clarification to deepen their technical reflection.`;
}

export function buildMockInterviewPrompt(input: {
  companyName: string;
  role: string;
  userMessage: string;
  targetQuestion: string;
  history: { sender: string; text: string }[];
}): string {
  const formattedHistory = (input.history || [])
    .map((h) => `${h.sender === 'user' ? 'Candidate' : 'Interviewer'}: ${sanitizePromptInput(h.text, 2000)}`)
    .join('\n');

  return `Company: ${sanitizePromptInput(input.companyName, 200)}
Role: ${sanitizePromptInput(input.role, 200)}
Current Question being asked: "${sanitizePromptInput(input.targetQuestion, 500)}"

Interview History:
${formattedHistory}

Candidate Latest Response:
"${sanitizePromptInput(input.userMessage, 4000)}"

Provide your feedback and the next response to the candidate. Keep the textual response clear and wrap your evaluation in JSON.`;
}
