import { Test, TestingModule } from '@nestjs/testing';
import { healthResponseSchema } from '@rich/schemas';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = module.get(AppController);
  });

  it('health는 공유 스키마를 만족하는 응답을 반환한다', () => {
    expect(healthResponseSchema.safeParse(controller.health()).success).toBe(true);
  });
});
