import { describe, expect, it } from 'vitest';
import { API_PORT, API_PREFIX, WEB_PORT } from './index.js';

describe('constants', () => {
  it('API prefix는 슬래시 없이 정의된다', () => {
    expect(API_PREFIX).not.toMatch(/^\/|\/$/);
  });

  it('API와 웹 포트가 겹치지 않는다', () => {
    expect(API_PORT).not.toBe(WEB_PORT);
  });
});
