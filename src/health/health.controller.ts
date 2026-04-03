import { Controller, Get, HttpException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  @Get()
  async check() {
    const dbHealthy = await this.checkDatabase();

    const status = dbHealthy ? 'healthy' : 'degraded';
    const httpStatus = dbHealthy ? 200 : 503;

    const response = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      checks: {
        database: dbHealthy ? 'up' : 'down',
      },
    };

    if (!dbHealthy) {
      throw new HttpException(response, httpStatus);
    }

    return response;
  }

  @Get('ready')
  async readiness() {
    const dbHealthy = await this.checkDatabase();
    if (!dbHealthy) {
      throw new HttpException(
        { status: 'not ready', reason: 'database unavailable' },
        503,
      );
    }
    return { status: 'ready' };
  }

  @Get('live')
  liveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
