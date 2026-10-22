#!/bin/bash
# Edit/Write 직후 수정된 .ts/.tsx/.js 파일 하나만 oxlint 로 검사한다.
# 경고까지 포함해 문제가 있으면 exit 2 로 Claude 에게 결과를 돌려준다.
set -euo pipefail

command -v jq >/dev/null || exit 0
file=$(jq -r '.tool_input.file_path // empty')
case "$file" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs | *.cjs) ;;
  *) exit 0 ;;
esac
[ -f "$file" ] || exit 0

oxlint="$CLAUDE_PROJECT_DIR/node_modules/.bin/oxlint"
[ -x "$oxlint" ] || exit 0

if ! output=$("$oxlint" --deny-warnings "$file" 2>&1); then
  echo "$output" >&2
  exit 2
fi
