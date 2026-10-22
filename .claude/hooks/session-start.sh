#!/bin/bash
# 클라우드 세션 시작 시 lint/test/typecheck 를 바로 돌릴 수 있도록 환경을 준비한다.
# 1) package.json engines 를 만족하는 Node 설치 (컨테이너 기본 Node 가 낮으면)
# 2) pnpm install
# 3) 공유 패키지(packages/*) 빌드 — 앱이 dist/ 를 import 하므로 필요
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

required_node=$(node -p "require('./package.json').engines.node.replace(/^>=/, '')")
pnpm_version=$(node -p "require('./package.json').packageManager.split('@')[1]")

version_ok() {
  # $1 >= $2 이면 성공
  [ "$(printf '%s\n%s\n' "$2" "$1" | sort -V | head -n1)" = "$2" ]
}

current_node=$(node -v | sed 's/^v//')
if ! version_ok "$current_node" "$required_node"; then
  major=$(tr -d '[:space:]v' < .nvmrc)
  base="https://nodejs.org/dist/latest-v${major}.x"
  shasums=$(curl -fsSL "$base/SHASUMS256.txt")
  tarball=$(echo "$shasums" | awk '/linux-x64\.tar\.xz$/ {print $2}')
  version=$(echo "$tarball" | sed -E 's/^node-v([0-9.]+)-.*/\1/')
  node_dir="$HOME/.local/node-v$version"

  if [ ! -x "$node_dir/bin/node" ]; then
    echo "Installing Node $version (current: $current_node, required: >=$required_node)" >&2
    tmp=$(mktemp -d)
    curl -fsSL "$base/$tarball" -o "$tmp/$tarball"
    (cd "$tmp" && echo "$shasums" | grep " $tarball\$" | sha256sum -c - >&2)
    mkdir -p "$node_dir"
    tar -xJf "$tmp/$tarball" -C "$node_dir" --strip-components=1
    rm -rf "$tmp"
  fi

  export PATH="$node_dir/bin:$PATH"
  if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
    echo "export PATH=\"$node_dir/bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
  fi
fi

if [ "$(pnpm -v 2>/dev/null || true)" != "$pnpm_version" ]; then
  npm install -g "pnpm@$pnpm_version" >&2
fi

pnpm install >&2
pnpm build:packages >&2
