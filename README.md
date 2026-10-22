# rich.gun.kim

pnpm 워크스페이스 기반 모노레포입니다.

## 요구 사항

- Node.js 22.22.3 이상 (`.nvmrc`, NestJS 12 요구 사항)
- pnpm **10.11.0** (`packageManager` 필드로 고정)

```sh
corepack enable   # 또는 pnpm 10 이상이 설치되어 있으면 자동으로 10.11.0으로 전환됩니다
pnpm install
```

npm / yarn 으로 설치하거나 다른 pnpm 버전을 쓰면 설치가 거부되거나 10.11.0으로 전환됩니다.

## 구조

```
apps/
  web/          # 프론트엔드 웹 앱 (Vite + React)
  api/          # 백엔드 API 서버 (NestJS)
packages/
  constants/    # 앱 간 공유 상수
  schemas/      # 앱 간 공유 스키마 (Zod 검증 스키마 + 요청/응답 타입)
tsconfig.base.json  # 모든 워크스페이스가 extends 하는 공유 tsconfig
```

워크스페이스 내부 패키지는 `"@rich/schemas": "workspace:*"` 처럼 `workspace:` 프로토콜로 참조합니다.
공유 패키지(`packages/*`)는 `tsc`로 `dist/`에 ESM으로 빌드되며, 앱은 빌드 결과물을 import 합니다.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `pnpm build` | 모든 워크스페이스 빌드 (의존 순서대로) |
| `pnpm dev` | 공유 패키지를 먼저 빌드한 뒤 모든 워크스페이스 dev 서버/watch 실행 |
| `pnpm lint` | 모든 워크스페이스 lint (oxlint) |
| `pnpm typecheck` | 공유 패키지를 먼저 빌드한 뒤 모든 워크스페이스 타입 검사 (`tsc --noEmit`) |
| `pnpm test` | 공유 패키지를 먼저 빌드한 뒤 모든 워크스페이스 테스트 (Vitest) |
| `pnpm check` | lint → typecheck → test 를 순서대로 실행 |

web과 api는 별도 출처(도메인)로 동작합니다.

- web은 `VITE_API_URL`(기본값 `http://localhost:3000`)로 API를 호출합니다.
- api는 `CORS_ORIGIN`(기본값 `http://localhost:5173`)에서 오는 요청을 허용합니다.

## CI

PR 에서는 GitHub Actions 로 두 가지를 검사하며, 둘 다 통과해야 main 에 머지할 수 있습니다.

| check | 내용 |
| --- | --- |
| `check` | `pnpm install --frozen-lockfile` 후 `pnpm check` (main push 에서도 실행) |
| `pr-title` | PR 제목이 Conventional Commits 형식인지 (허용 type · scope, 72자 이내, 끝 마침표 금지). 규칙은 `CLAUDE.md` 의 "커밋" 참고 |
