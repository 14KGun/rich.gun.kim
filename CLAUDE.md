# CLAUDE.md

pnpm 워크스페이스 모노레포. 구조와 실행 방법의 상세는 `README.md` 참고.

- `apps/web` — Vite + React 19 프론트엔드
- `apps/api` — NestJS 12 백엔드 (CommonJS, Vitest)
- `packages/constants` — 공유 상수 (포트 등)
- `packages/schemas` — 공유 Zod 스키마 + 요청/응답 타입

## 명령

| 명령 | 용도 |
| --- | --- |
| `pnpm check` | lint → typecheck → test 전체. 작업을 마치기 전에 반드시 실행 |
| `pnpm lint` | oxlint |
| `pnpm typecheck` | 공유 패키지 빌드 후 모든 워크스페이스 `tsc --noEmit` |
| `pnpm test` | 공유 패키지 빌드 후 모든 워크스페이스 Vitest |
| `pnpm --filter @rich/api test` | 워크스페이스 하나만 실행 (`@rich/web`, `@rich/schemas` 등) |

## 규칙

- **pnpm 10.11.0만 사용한다.** npm / yarn 은 `only-allow` 와 `engine-strict` 로 막혀 있다.
  Node 는 `>=22.22.3` 이 필요하다 (클라우드 세션에서는 SessionStart 훅이 설치한다).
- 내부 패키지는 `"@rich/<name>": "workspace:*"` 로 참조한다.
- 앱은 `packages/*` 의 `dist/` 를 import 한다. `packages/*` 를 수정한 뒤 앱에서 타입 오류가 나면
  먼저 `pnpm build:packages` 를 실행한다.
- `packages/*` 는 ESM(`nodenext`) 이다. 상대 import 에 `.js` 확장자를 붙인다 (`./health.js`).
- web ↔ api 사이의 요청/응답 형태는 `packages/schemas` 에 Zod 스키마로 정의하고,
  타입은 `z.infer` 로 만든다. 앱에서 같은 타입을 따로 선언하지 않는다.
- 공유 상수(포트 등)는 `packages/constants` 에 둔다.
- 테스트는 대상 파일 옆에 둔다 (web: `*.test.ts`, api: `*.spec.ts`).
- 코드 주석과 문서는 한국어로 작성한다.
- `.env*` 파일은 읽거나 커밋하지 않는다.

## 하네스

`.claude/settings.json`

- SessionStart 훅 (`.claude/hooks/session-start.sh`, 클라우드 세션에서만 실행): Node 설치,
  `pnpm install`, `pnpm build:packages`
- PostToolUse 훅 (`.claude/hooks/lint-edited-file.sh`): Edit/Write 한 JS/TS 파일에 oxlint 를
  `--deny-warnings` 로 실행한다. 경고가 보고되면 바로 고친다.
