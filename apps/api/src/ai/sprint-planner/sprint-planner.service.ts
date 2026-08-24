import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service.js';
import { OpenAIService } from '../llm/openai.service.js';
import { PromptService } from '../llm/prompt.service.js';
import { CreateSprintPlanDto } from './dto/create-sprint-plan.dto.js';

@Injectable()
export class SprintPlannerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openAIService: OpenAIService,
    private readonly promptService: PromptService,
  ) {}

  async createPlan(dto: CreateSprintPlanDto) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: dto.projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const issues = await this.prisma.issue.findMany({
      where: {
        projectId: dto.projectId,
        ...(dto.issueIds?.length
          ? {
              id: {
                in: dto.issueIds,
              },
            }
          : {}),
      },
      take: 50,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const context = JSON.stringify({
      project: {
        id: project.id,
        name: project.name,
      },
      sprintGoal: dto.goal ?? null,
      durationDays: dto.durationDays ?? 14,
      issues,
    });

    const prompt = `
Create a practical sprint plan for the following project.

Project:
${context}

Return:
1. Sprint goal
2. Recommended tasks
3. Priority for each task
4. Suggested order
5. Potential risks
6. Expected sprint outcome

Keep the response concise and actionable.
`;

    const plan = await this.openAIService.generateText(
      prompt,
      this.promptService.buildSystemPrompt(),
    );

    return {
      projectId: dto.projectId,
      goal: dto.goal ?? null,
      durationDays: dto.durationDays ?? 14,
      issueCount: issues.length,
      plan,
    };
  }

  async getProjectIssues(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.issue.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
  }
}