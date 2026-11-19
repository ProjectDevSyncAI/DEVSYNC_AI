import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service.js';
import * as bcrypt from 'bcrypt';

import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const username = dto.username.trim();

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email is already registered');
      }

      throw new ConflictException('Username is already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        passwordHash,
<<<<<<< HEAD
        platformRole: 'USER',
        tokenVersion: 1,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        platformRole: true,
        tokenVersion: true,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      },
    });

    return this.createAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
<<<<<<< HEAD
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        platformRole: true,
        tokenVersion: true,
      },
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    });

    return this.createAuthResponse(updatedUser);
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        bio: true,
        status: true,
<<<<<<< HEAD
        platformRole: true,
        tokenVersion: true,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
        lastLoginAt: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return user;
  }

  private createAuthResponse(user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
<<<<<<< HEAD
    platformRole?: string;
    tokenVersion?: number;
  }) {
    const platformRole = user.platformRole || 'USER';
    const tokenVersion = user.tokenVersion ?? 1;

=======
  }) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
<<<<<<< HEAD
      platformRole,
      tokenVersion,
      roles: [platformRole],
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
<<<<<<< HEAD
        platformRole,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      },
    };
  }
}