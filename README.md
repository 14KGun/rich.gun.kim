# rich.gun.kim

pnpm 워크스페이스 기반 모노레포입니다.

## 요구 사항

- Node.js 22 이상 (`.nvmrc`)
- pnpm **10.11.0** (`packageManager` 필드로 고정)

```sh
corepack enable   # 또는 pnpm 10 이상이 설치되어 있으면 자동으로 10.11.0으로 전환됩니다
pnpm install
```

npm / yarn 으로 설치하거나 다른 pnpm 버전을 쓰면 설치가 거부되거나 10.11.0으로 전환됩니다.

## 구조

```
apps/       # 배포 가능한 애플리케이션
packages/   # 앱들이 공유하는 라이브러리
```

워크스페이스 내부 패키지는 `"@rich/ui": "workspace:*"` 처럼 `workspace:` 프로토콜로 참조합니다.
