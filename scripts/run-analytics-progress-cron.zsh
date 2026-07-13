#!/bin/zsh

set -euo pipefail

REPO_ROOT="${0:A:h:h}"
cd "$REPO_ROOT"

NODE_BIN="${NODE_BIN:-/opt/homebrew/bin/node}"
if [[ ! -x "$NODE_BIN" ]]; then
  NODE_BIN="$(command -v node)"
fi

MODE="${1:---send}"
exec "$NODE_BIN" \
  --env-file=apps/dashboard/.env.local \
  scripts/analytics-progress-report.mjs \
  "$MODE"
