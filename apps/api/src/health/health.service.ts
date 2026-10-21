import { Injectable } from '@nestjs/common';
import type { HealthResponse } from '@rich/schemas';

@Injectable()
export class HealthService {
  check(): HealthResponse {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
