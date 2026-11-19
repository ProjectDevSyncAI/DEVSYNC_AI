import {
<<<<<<< HEAD
  BadRequestException,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';
<<<<<<< HEAD
import { validateActivityMetadata } from './helpers/metadata-validator.helper.js';

export const MAX_ACTIVITY_PAGE = 10000;
export const MAX_ACTIVITY_LIMIT = 100;
export const MAX_ACTIVITY_OFFSET = 500000;

export const SAFE_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  avatarUrl: true,
} as const;

export const SAFE_PROJECT_SELECT = {
  id: true,
  name: true,
  key: true,
  organizationId: true,
} as const;

export const SAFE_ACTIVITY_SELECT = {
  id: true,
  projectId: true,
  userId: true,
  type: true,
  title: true,
  description: true,
  entityType: true,
  entityId: true,
  metadata: true,
  createdAt: true,
  project: {
    select: SAFE_PROJECT_SELECT,
  },
  user: {
    select: SAFE_USER_SELECT,
  },
} as const;

export interface PaginatedActivityResponse<T = any> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

function validatePaginationParams(
  page: number,
  limit: number,
): { page: number; limit: number; skip: number } {
  const pageNum = Number(page ?? 1);
  const limitNum = Number(limit ?? 20);

  if (!Number.isInteger(pageNum) || pageNum < 1 || !Number.isSafeInteger(pageNum)) {
    throw new BadRequestException('Page must be a valid positive integer');
  }
  if (pageNum > MAX_ACTIVITY_PAGE) {
    throw new BadRequestException(`Page cannot exceed ${MAX_ACTIVITY_PAGE}`);
  }

  if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > MAX_ACTIVITY_LIMIT || !Number.isSafeInteger(limitNum)) {
    throw new BadRequestException(`Limit must be an integer between 1 and ${MAX_ACTIVITY_LIMIT}`);
  }

  const skip = (pageNum - 1) * limitNum;
  if (!Number.isSafeInteger(skip) || skip > MAX_ACTIVITY_OFFSET) {
    throw new BadRequestException(`Pagination offset exceeds maximum permitted limit (${MAX_ACTIVITY_OFFSET})`);
  }

  return { page: pageNum, limit: limitNum, skip };
}
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateActivityDto) {
<<<<<<< HEAD
    const validatedMetadata = validateActivityMetadata(dto.metadata);

=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.prisma.activity.create({
      data: {
        projectId: dto.projectId,
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        entityType: dto.entityType,
        entityId: dto.entityId,
<<<<<<< HEAD
        metadata: validatedMetadata as any,
      },
      select: SAFE_ACTIVITY_SELECT,
    });
  }

  /**
   * Internal trusted event writer for domain services.
   * Can execute within a provided Prisma transaction client or standalone.
   */
  async createEvent(
    params: {
      projectId: string;
      userId?: string | null;
      type: string;
      title: string;
      description?: string;
      entityType?: string;
      entityId?: string;
      metadata?: Record<string, unknown>;
    },
    prismaClient?: any,
  ) {
    if (!params.projectId) {
      return null;
    }

    const client = prismaClient || this.prisma;
    const validatedMetadata = validateActivityMetadata(params.metadata);

    const safeTitle = (params.title || '').trim().slice(0, 250);
    const safeDescription = params.description
      ? params.description.trim().slice(0, 2000)
      : undefined;

    return client.activity.create({
      data: {
        projectId: params.projectId,
        userId: params.userId ?? null,
        type: params.type,
        title: safeTitle,
        description: safeDescription,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: (validatedMetadata as any) ?? undefined,
      },
      select: SAFE_ACTIVITY_SELECT,
=======
        metadata: dto.metadata as any,
      },
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    });
  }

  async findAll(
    projectId?: string,
    userId?: string,
    type?: string,
<<<<<<< HEAD
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedActivityResponse> {
    const { page: safePage, limit: safeLimit, skip } = validatePaginationParams(page, limit);

    const where = {
      ...(projectId ? { projectId } : {}),
      ...(userId ? { userId } : {}),
      ...(type ? { type } : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.activity.count({ where }),
      this.prisma.activity.findMany({
        where,
        take: safeLimit,
        skip,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: SAFE_ACTIVITY_SELECT,
      }),
    ]);

    const totalPages = Math.ceil(total / safeLimit) || (total === 0 ? 0 : 1);

    return {
      items,
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1 && totalPages > 0,
    };
  }

  async findAllForProjects(
    projectIds: string[],
    userId?: string,
    type?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedActivityResponse> {
    const { page: safePage, limit: safeLimit, skip } = validatePaginationParams(page, limit);

    const where = {
      projectId: { in: projectIds },
      ...(userId ? { userId } : {}),
      ...(type ? { type } : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.activity.count({ where }),
      this.prisma.activity.findMany({
        where,
        take: safeLimit,
        skip,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: SAFE_ACTIVITY_SELECT,
      }),
    ]);

    const totalPages = Math.ceil(total / safeLimit) || (total === 0 ? 0 : 1);

    return {
      items,
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1 && totalPages > 0,
    };
  }

  async findById(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      select: SAFE_ACTIVITY_SELECT,
    });
=======
  ) {
    return this.prisma.activity.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(userId ? { userId } : {}),
        ...(type ? { type } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        project: true,
        user: true,
      },
    });
  }

  async findById(id: string) {
    const activity =
      await this.prisma.activity.findUnique({
        where: { id },
        include: {
          project: true,
          user: true,
        },
      });
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

    if (!activity) {
      throw new NotFoundException(
        'Activity not found',
      );
    }

    return activity;
  }

  async update(
    id: string,
    dto: UpdateActivityDto,
  ) {
    await this.findById(id);

<<<<<<< HEAD
    const validatedMetadata = dto.metadata !== undefined
      ? validateActivityMetadata(dto.metadata)
      : undefined;

=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.prisma.activity.update({
      where: { id },
      data: {
        ...(dto.type !== undefined
          ? { type: dto.type }
          : {}),
        ...(dto.title !== undefined
          ? { title: dto.title }
          : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.entityType !== undefined
          ? { entityType: dto.entityType }
          : {}),
        ...(dto.entityId !== undefined
          ? { entityId: dto.entityId }
          : {}),
<<<<<<< HEAD
        ...(validatedMetadata !== undefined
          ? { metadata: validatedMetadata as any }
          : {}),
      },
      select: SAFE_ACTIVITY_SELECT,
=======
        ...(dto.metadata !== undefined
          ? { metadata: dto.metadata as any }
          : {}),
      },
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    });
  }

  async remove(id: string) {
    await this.findById(id);

    return this.prisma.activity.delete({
      where: { id },
    });
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
