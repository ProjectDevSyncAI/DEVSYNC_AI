import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const start = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        service: 'devsync-api',
        database: 'connected',
        responseTimeMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('DATABASE ERROR:', error);

      return {
        status: 'error',
        service: 'devsync-api',
        database: 'disconnected',
        error:
          error instanceof Error
            ? error.message
            : String(error),
        responseTimeMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }
}