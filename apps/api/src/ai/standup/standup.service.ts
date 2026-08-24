import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service.js';
import { OpenAIService } from '../llm/openai.service.js';
import { PromptService } from '../llm/prompt.service.js';
import { GenerateStandupDto } from './dto/generate-standup.dto.js';

@Injectable()
export class StandupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openAIService: OpenAIService,
    private readonly promptService: PromptService,
  ) {}

  async generate(dto: GenerateStandupDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: dto.userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const issues = await this.prisma.issue.findMany({
      where: dto.projectId
        ? {
            projectId: dto.projectId,
          }
        : {},
      take: 30,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const context = JSON.stringify({
      userId: dto.userId,
      projectId: dto.projectId ?? null,
      date:
        dto.date ??
        new Date().toISOString().split('T')[0],
      recentIssues: issues,
    });

    const prompt = `
Generate a concise daily standup update from the following
development activity.

Context:
${context}

Use exactly this structure:

Yesterday:
- ...

Today:
- ...

Blockers:
- ...

Keep it realistic, concise and professional.
Do not invent specific work that is not supported by the context.
`;

    const standup =
      await this.openAIService.generateText(
        prompt,
        this.promptService.buildSystemPrompt(),
      );

    return {
      userId: dto.userId,
      projectId: dto.projectId ?? null,
      date:
        dto.date ??
        new Date().toISOString().split('T')[0],
      standup,
    };
  }
}