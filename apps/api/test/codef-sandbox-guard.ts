/**
 * 테스트에서 CODEF 데모·정식 서버를 호출하지 못하게 막는다.
 * 실제 기관 데이터를 조회하거나 호출 과다로 IP 가 차단되는 일을 막기 위해,
 * codef.io 중에서는 샌드박스와 토큰 발급 서버만 허용한다.
 */
const ALLOWED_CODEF_HOSTS = new Set(['sandbox.codef.io', 'oauth.codef.io']);

export function isBlockedCodefHost(hostname: string): boolean {
  return hostname.endsWith('codef.io') && !ALLOWED_CODEF_HOSTS.has(hostname);
}

const originalFetch = globalThis.fetch;

globalThis.fetch = (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (isBlockedCodefHost(url.hostname)) {
    return Promise.reject(
      new Error(`테스트에서는 CODEF 샌드박스만 호출할 수 있습니다: ${url.hostname}`),
    );
  }
  return originalFetch(input, init);
};
