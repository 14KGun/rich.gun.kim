import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@rich/schemas';

@Controller()
export class AppController {
  @Get('health')
  health(): HealthResponse {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
