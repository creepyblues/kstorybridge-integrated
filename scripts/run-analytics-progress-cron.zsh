#!/bin/zsh

set -euo pipefail

REPO_ROOT="${0:A:h:h}"
cd "$REPO_ROOT"

NODE_BIN="${NODE_BIN:-/opt/homebrew/bin/node}"
if [[ ! -x "$NODE_BIN" ]]; then
  NODE_BIN="$(command -v node)"
fi

# The GA clean-window gate uses the same read-only service-account file as the
# local analytics MCP. Resolve only its path; never print or copy credentials.
if [[ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" && -f .mcp.json ]]; then
  GA_CREDENTIAL_PATH="$($NODE_BIN -e 'const config=JSON.parse(require("fs").readFileSync(".mcp.json","utf8")); process.stdout.write(config.mcpServers?.["analytics-mcp"]?.env?.GOOGLE_APPLICATION_CREDENTIALS || "")')"
  if [[ -n "$GA_CREDENTIAL_PATH" && -f "$GA_CREDENTIAL_PATH" ]]; then
    export GOOGLE_APPLICATION_CREDENTIALS="$GA_CREDENTIAL_PATH"
  fi
fi

MODE="${1:---send}"
exec "$NODE_BIN" \
  --env-file=apps/dashboard/.env.local \
  scripts/analytics-progress-report.mjs \
  "$MODE"
