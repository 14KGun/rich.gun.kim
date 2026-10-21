import { describe, expect, it } from 'vitest';
import { healthResponseSchema } from './health.js';

describe('healthResponseSchema', () => {
  it('올바른 응답을 통과시킨다', () => {
    const value = { status: 'ok', uptime: 1.5, timestamp: new Date().toISOString() };
    expect(healthResponseSchema.parse(value)).toEqual(value);
  });

  it('잘못된 응답을 거부한다', () => {
    const result = healthResponseSchema.safeParse({ status: 'down', uptime: -1, timestamp: 'now' });
    expect(result.success).toBe(false);
  });
});
