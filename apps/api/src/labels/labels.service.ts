import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateLabelDto } from './dto/create-label.dto.js';
import { UpdateLabelDto } from './dto/update-label.dto.js';

@Injectable()
export class LabelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLabelDto) {
    return this.prisma.label.create({
      data: {
        organizationId: dto.organizationId,
        name: dto.name,
        color: dto.color,
      },
    });
  }

  async findAll() {
    return this.prisma.label.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const label = await this.prisma.label.findUnique({
      where: { id },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    return label;
  }

  async update(id: string, dto: UpdateLabelDto) {
    await this.findOne(id);

    return this.prisma.label.update({
      where: { id },
      data: {
        name: dto.name,
        color: dto.color,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.label.delete({
      where: { id },
    });
  }
}