import { Test, TestingModule } from '@nestjs/testing';
import { healthResponseSchema } from '@rich/schemas';
import { beforeEach, describe, expect, it } from 'vitest';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    controller = module.get(HealthController);
  });

  it('공유 스키마를 만족하는 응답을 반환한다', () => {
    expect(healthResponseSchema.safeParse(controller.check()).success).toBe(true);
  });
});
