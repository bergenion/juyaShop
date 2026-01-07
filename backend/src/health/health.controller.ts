import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    const dbConnected = await this.prisma.checkConnection();
    
    return {
      status: dbConnected ? 'ok' : 'error',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db')
  async checkDatabase() {
    try {
      const result = await this.prisma.$queryRaw`SELECT version() as version, current_database() as database, current_user as user`;
      return {
        status: 'connected',
        ...result[0],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

