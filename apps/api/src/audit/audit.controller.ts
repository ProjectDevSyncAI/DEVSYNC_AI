import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { AuditService } from './audit.service.js';
import { CreateAuditDto } from './dto/create-audit.dto.js';

@Controller('audit')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
  ) {}

  @Post()
  create(@Body() dto: CreateAuditDto) {
    return this.auditService.create(dto);
  }

  @Get()
  findAll(
    @Query('organizationId') organizationId?: string,
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.auditService.findAll(
      organizationId,
      userId,
      entityType,
      entityId,
    );
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.auditService.findByUser(userId);
  }

  @Get('organization/:organizationId')
  findByOrganization(
    @Param('organizationId') organizationId: string,
  ) {
    return this.auditService.findByOrganization(
      organizationId,
    );
  }

  @Get('entity/:entityType/:entityId')
  findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.findByEntity(
      entityType,
      entityId,
    );
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.auditService.findById(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.auditService.remove(id);
  }
}