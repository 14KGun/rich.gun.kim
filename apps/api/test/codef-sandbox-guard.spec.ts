import { describe, expect, it } from 'vitest';
import { isBlockedCodefHost } from './codef-sandbox-guard';

describe('CODEF 샌드박스 가드', () => {
  it('데모·정식 서버로 가는 요청은 테스트에서 막는다', async () => {
    await expect(fetch('https://development.codef.io/v1/kr/bank/p/account/account-list')).rejects.toThrow(
      'CODEF 샌드박스만',
    );
    await expect(fetch('https://api.codef.io/v1/account/list')).rejects.toThrow('CODEF 샌드박스만');
  });

  it('샌드박스와 토큰 발급 서버, codef.io 가 아닌 호스트는 막지 않는다', () => {
    expect(isBlockedCodefHost('sandbox.codef.io')).toBe(false);
    expect(isBlockedCodefHost('oauth.codef.io')).toBe(false);
    expect(isBlockedCodefHost('example.com')).toBe(false);
  });
});
