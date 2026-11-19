import {
  Body,
  Controller,
  Delete,
<<<<<<< HEAD
  ForbiddenException,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  Get,
  Param,
  Patch,
  Post,
<<<<<<< HEAD
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PrismaService } from '../database/prisma.service.js';
=======
} from '@nestjs/common';
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Controller('users')
<<<<<<< HEAD
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma?: PrismaService,
  ) {}

  @Get()
  async findAll(@Req() req: any) {
    const actorUserId = req?.user?.userId || req?.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }
    return this.usersService.findAllForActor(actorUserId);
  }

  @Get(':id')
  async findById(@Req() req: any, @Param('id') id: string) {
    const actorUserId = req?.user?.userId || req?.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }
    return this.usersService.findByIdForActor(id, actorUserId);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateUserDto) {
    const actorUserId = req?.user?.userId || req?.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }
    await this.assertAdminAccess(actorUserId, req.user);
=======
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.usersService.create(dto);
  }

  @Patch(':id')
  update(
<<<<<<< HEAD
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const actorUserId = req?.user?.userId || req?.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }
    if (id !== actorUserId) {
      throw new ForbiddenException('Cannot modify another user profile');
    }
=======
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
<<<<<<< HEAD
  remove(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const actorUserId = req?.user?.userId || req?.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }
    if (id !== actorUserId) {
      throw new ForbiddenException('Cannot delete another user profile');
    }
    return this.usersService.remove(id);
  }

  private async assertAdminAccess(actorUserId: string, user: any) {
    if (user?.roles?.includes('ADMIN') || user?.roles?.includes('OWNER')) {
      return;
    }

    if (this.prisma) {
      const adminMembership = await this.prisma.organizationMember.findFirst({
        where: {
          userId: actorUserId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
        select: { id: true },
      });

      if (adminMembership) {
        return;
      }
    }

    throw new ForbiddenException('Only organization administrators can provision users');
  }
=======
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
}