import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import { CreateSprintMemberDto } from './dto/create-sprint-member.dto.js';

@Injectable()
export class SprintMembersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSprintMemberDto) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id: dto.sprintId },
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    return this.prisma.sprintMember.create({
      data: {
        sprintId: dto.sprintId,
        userId: dto.userId,
      },
    });
  }

  async findAll() {
    return this.prisma.sprintMember.findMany({
      include: {
        sprint: true,
        user: true,
      },
    });
  }

  async findBySprint(sprintId: string) {
    return this.prisma.sprintMember.findMany({
      where: { sprintId },
      include: {
        user: true,
      },
    });
  }

  async remove(id: string) {
    const member = await this.prisma.sprintMember.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException('Sprint member not found');
    }

    return this.prisma.sprintMember.delete({
      where: { id },
    });
  }
}