import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 통합 테스트는 실제 네트워크를 쓰므로 `pnpm test:integration` 으로만 실행한다.
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.integration.spec.ts'],
    setupFiles: ['./test/codef-sandbox-guard.ts'],
  },
});
