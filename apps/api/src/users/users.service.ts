import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
<<<<<<< HEAD
import * as bcrypt from 'bcrypt';
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import { PrismaService } from '../database/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

<<<<<<< HEAD
export const SAFE_USER_SELECT = {
  id: true,
  email: true,
  username: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  bio: true,
  status: true,
  platformRole: true,
  tokenVersion: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
<<<<<<< HEAD
    const email = dto.email.trim().toLowerCase();
    const username = dto.username.trim();

    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
=======
    const existingEmail = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    });

    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const existingUsername = await this.prisma.user.findUnique({
<<<<<<< HEAD
      where: { username },
=======
      where: {
        username: dto.username,
      },
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    });

    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

<<<<<<< HEAD
    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        email,
        username,
        firstName: dto.firstName?.trim() ?? '',
        lastName: dto.lastName?.trim() ?? '',
        avatarUrl: dto.avatarUrl ?? null,
        passwordHash,
        platformRole: 'USER',
        tokenVersion: 1,
      },
      select: SAFE_USER_SELECT,
=======
    return this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        firstName: dto.firstName ?? '',
        lastName: dto.lastName ?? '',
        passwordHash: dto.password,
      },
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
<<<<<<< HEAD
      select: SAFE_USER_SELECT,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAllForActor(actorUserId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId: actorUserId },
      select: { organizationId: true },
    });

    const orgIds = memberships.map((m) => m.organizationId);

    return this.prisma.user.findMany({
      where: {
        OR: [
          { id: actorUserId },
          ...(orgIds.length > 0
            ? [
                {
                  memberships: {
                    some: {
                      organizationId: { in: orgIds },
                    },
                  },
                },
                {
                  ownedOrganizations: {
                    some: {
                      id: { in: orgIds },
                    },
                  },
                },
              ]
            : []),
        ],
      },
      select: SAFE_USER_SELECT,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
<<<<<<< HEAD
      where: { id },
      select: SAFE_USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByIdForActor(id: string, actorUserId: string) {
    if (id === actorUserId) {
      return this.findById(id);
    }

    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId: actorUserId },
      select: { organizationId: true },
    });

    const orgIds = memberships.map((m) => m.organizationId);

    if (orgIds.length === 0) {
      throw new NotFoundException('User not found');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id,
        OR: [
          {
            memberships: {
              some: {
                organizationId: { in: orgIds },
              },
            },
          },
          {
            ownedOrganizations: {
              some: {
                id: { in: orgIds },
              },
            },
          },
        ],
      },
      select: SAFE_USER_SELECT,
=======
      where: {
        id,
      },
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findOne(id: string) {
    return this.findById(id);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
<<<<<<< HEAD
      where: { email },
      select: SAFE_USER_SELECT,
=======
      where: {
        email,
      },
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
<<<<<<< HEAD
      where: { username },
      select: SAFE_USER_SELECT,
=======
      where: {
        username,
      },
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    });
  }

  async update(id: string, dto: UpdateUserDto) {
<<<<<<< HEAD
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    // Explicitly cherry-pick allowed fields to prevent any prototype/property injection
    const updateData: any = {};
    if (dto.email !== undefined) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      if (normalizedEmail !== existing.email) {
        updateData.email = normalizedEmail;
        updateData.emailVerifiedAt = null; // F3: Invalidate verified-email timestamp when address changes!
      }
    }
    if (dto.name !== undefined) updateData.firstName = dto.name.trim();
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName.trim();
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;

    if ((dto as any).password) {
      updateData.passwordHash = await bcrypt.hash((dto as any).password, 12);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: SAFE_USER_SELECT,
=======
    await this.findById(id);

    return this.prisma.user.update({
      where: {
        id,
      },
      data: dto,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    });
  }

  async remove(id: string) {
    await this.findById(id);

    return this.prisma.user.delete({
<<<<<<< HEAD
      where: { id },
      select: SAFE_USER_SELECT,
    });
  }

  async setPlatformRole(id: string, platformRole: 'USER' | 'ADMIN') {
    const user = await this.findById(id);

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        platformRole,
        tokenVersion: { increment: 1 },
      },
      select: SAFE_USER_SELECT,
=======
      where: {
        id,
      },
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    });
  }
}