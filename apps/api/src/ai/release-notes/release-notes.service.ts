import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service.js';
import { OpenAIService } from '../llm/openai.service.js';
import { PromptService } from '../llm/prompt.service.js';
import { GenerateReleaseNotesDto } from './dto/generate-release-notes.dto.js';

@Injectable()
export class ReleaseNotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openAIService: OpenAIService,
    private readonly promptService: PromptService,
  ) {}

  async generate(dto: GenerateReleaseNotesDto) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: dto.projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const prompt = `
Generate professional release notes for the following project.

Project:
${JSON.stringify({
  id: project.id,
  name: project.name,
})}

Version:
${dto.version ?? 'Latest'}

Date range:
${dto.from ?? 'Beginning'} to ${dto.to ?? 'Now'}

Write concise release notes including:
- New features
- Improvements
- Bug fixes
- Important changes

Return clean Markdown.
`;

    const content = await this.openAIService.generateText(
      prompt,
      this.promptService.buildSystemPrompt(),
    );

    return {
      projectId: dto.projectId,
      version: dto.version ?? null,
      content,
    };
  }
}