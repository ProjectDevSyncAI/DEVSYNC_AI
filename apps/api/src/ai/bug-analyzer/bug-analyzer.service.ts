import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service.js';
import { OpenAIService } from '../llm/openai.service.js';
import { PromptService } from '../llm/prompt.service.js';

@Injectable()
export class BugAnalyzerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openAIService: OpenAIService,
    private readonly promptService: PromptService,
  ) {}

  async analyze(
    description: string,
    projectId?: string,
  ) {
    let context = '';

    if (projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          issues: {
            take: 10,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (project) {
        context = JSON.stringify({
          project: {
            id: project.id,
            name: project.name,
          },
          recentIssues: project.issues,
        });
      }
    }

    const prompt =
      this.promptService.buildBugAnalysisPrompt(
        description,
        context,
      );

    const analysis =
      await this.openAIService.generateText(
        prompt,
        this.promptService.buildSystemPrompt(),
      );

    return {
      description,
      projectId,
      analysis,
    };
  }
}
