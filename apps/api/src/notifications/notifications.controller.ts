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
  Query,
<<<<<<< HEAD
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
=======
} from '@nestjs/common';

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import { NotificationsService } from './notifications.service.js';
import { CreateNotificationDto } from './dto/create-notification.dto.js';
import { UpdateNotificationDto } from './dto/update-notification.dto.js';

@Controller('notifications')
<<<<<<< HEAD
@UseGuards(JwtAuthGuard)
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
<<<<<<< HEAD
  create(@Req() req: any, @Body() dto: CreateNotificationDto) {
    const actorUserId = req?.user?.userId || req?.user?.id || '';
    return this.notificationsService.create(dto, actorUserId);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: any) {
    const userId = req?.user?.userId || req?.user?.id || '';
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: any) {
    const userId = req?.user?.userId || req?.user?.id || '';
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch('user/:userId/read-all')
  markAllAsReadByUser(
    @Req() req: any,
    @Param('userId') paramUserId: string,
  ) {
    const authUserId = req?.user?.userId || req?.user?.id || '';
    if (paramUserId && paramUserId !== authUserId) {
      throw new ForbiddenException('Cannot mark notifications for another user');
    }
    return this.notificationsService.markAllAsRead(authUserId);
=======
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }

  @Get()
  findAll(
<<<<<<< HEAD
    @Req() req: any,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('userId') clientUserId?: string,
  ) {
    const authUserId = req?.user?.userId || req?.user?.id || '';
    if (clientUserId && clientUserId !== authUserId) {
      throw new ForbiddenException('Cannot access notifications of another user');
    }
    return this.notificationsService.findAll(
      authUserId,
=======
    @Query('userId') userId: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.findAll(
      userId,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      unreadOnly === 'true',
    );
  }

  @Get(':id')
<<<<<<< HEAD
  findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req?.user?.userId || req?.user?.id || '';
    return this.notificationsService.findOne(userId, id);
  }

  @Patch(':id/read')
  markAsRead(@Req() req: any, @Param('id') id: string) {
    const userId = req?.user?.userId || req?.user?.id || '';
    return this.notificationsService.markAsRead(userId, id);
=======
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }

  @Patch(':id')
  update(
<<<<<<< HEAD
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateNotificationDto,
  ) {
    const userId = req?.user?.userId || req?.user?.id || '';
    return this.notificationsService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const userId = req?.user?.userId || req?.user?.id || '';
    return this.notificationsService.remove(userId, id);
=======
    @Param('id') id: string,
    @Body() dto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, dto);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('user/:userId/read-all')
  markAllAsRead(@Param('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }
}
