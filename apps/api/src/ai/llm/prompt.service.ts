import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptService {
  buildSystemPrompt(): string {
    return `
You are DevSync AI, an AI assistant for software development teams.

Your responsibilities:
- Help developers understand code and project activity.
- Analyze tasks, issues, pull requests and development activity.
- Provide concise and actionable recommendations.
- Identify risks and potential problems.
- Explain technical concepts clearly.
- Never invent project data that is not provided.

When project context is provided, use that context when generating your answer.
`;
  }

  buildProjectPrompt(
    question: string,
    context?: string,
  ): string {
    return `
Project Context:
${context ?? 'No project context provided.'}

User Question:
${question}

Provide a clear, useful and actionable response.
`;
  }

  buildBugAnalysisPrompt(
    description: string,
    context?: string,
  ): string {
    return `
Analyze the following software bug.

Bug Description:
${description}

Additional Context:
${context ?? 'No additional context provided.'}

Return:
1. Possible cause
2. Severity
3. Recommended investigation
4. Suggested solution
`;
  }
}
