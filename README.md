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
| `pnpm test` | 공유 패키지를 먼저 빌드한 뒤 모든 워크스페이스 테스트 (Vitest) |

개발 중에는 web(`http://localhost:5173`)이 `/api` 요청을 api(`http://localhost:3000`)로 프록시합니다.
