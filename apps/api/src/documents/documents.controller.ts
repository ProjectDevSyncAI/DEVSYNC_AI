import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { DocumentsService } from './documents.service.js';
import { CreateDocumentDto } from './dto/create-document.dto.js';
import { UpdateDocumentDto } from './dto/update-document.dto.js';
import { CreateChunkDto } from './dto/create-chunk.dto.js';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
  ) {}

  @Post()
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('repositoryId') repositoryId?: string,
  ) {
    return this.documentsService.findAll(
      projectId,
      repositoryId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }

  @Post(':id/chunks')
  createChunk(
    @Param('id') documentId: string,
    @Body() dto: CreateChunkDto,
  ) {
    return this.documentsService.createChunk({
      ...dto,
      documentId,
    });
  }

  @Get(':id/chunks')
  getChunks(@Param('id') documentId: string) {
    return this.documentsService.getChunks(documentId);
  }

  @Delete('chunks/:id')
  deleteChunk(@Param('id') id: string) {
    return this.documentsService.deleteChunk(id);
  }
}