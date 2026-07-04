#!/usr/bin/env bash
# rotation-healthcheck.sh — READ-ONLY health check for the key-rotation runbook.
# Prints a green/red line per surface so you can confirm nothing broke before and
# after each rotation step. Makes NO writes and deploys nothing.
#
# Usage:
#   bash scripts/rotation-healthcheck.sh                 # uses the anon key in apps/dashboard/.env.local
#   SUPABASE_KEY=sb_publishable_xxx bash scripts/rotation-healthcheck.sh   # test a NEW publishable key
#
# Exit code 0 = all checks passed, 1 = at least one failed.

set -uo pipefail
export PATH=/usr/bin:/bin:/usr/local/bin

SUPA_URL="https://dlrnrgcoguxlkkcitlpd.supabase.co"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Key to test with: env override, else the anon key from the dashboard app.
KEY="${SUPABASE_KEY:-}"
if [ -z "$KEY" ]; then
  KEY="$(grep -h 'VITE_SUPABASE_ANON_KEY' "$REPO_ROOT/apps/dashboard/.env.local" 2>/dev/null | head -1 | cut -d= -f2)"
fi
if [ -z "$KEY" ]; then
  echo "ERROR: no key found. Set SUPABASE_KEY=... or ensure apps/dashboard/.env.local has VITE_SUPABASE_ANON_KEY."
  exit 1
fi

pass=0; fail=0
GREEN=$'\033[32m'; RED=$'\033[31m'; DIM=$'\033[2m'; RST=$'\033[0m'

ok()   { printf "  ${GREEN}PASS${RST}  %-42s ${DIM}%s${RST}\n" "$1" "$2"; pass=$((pass+1)); }
bad()  { printf "  ${RED}FAIL${RST}  %-42s ${DIM}%s${RST}\n" "$1" "$2"; fail=$((fail+1)); }

# 1) Public web surfaces should return HTTP 200
check_http () { # name url
  local code; code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 20 "$2")
  if [ "$code" = "200" ]; then ok "$1" "HTTP $code"; else bad "$1" "HTTP $code (expected 200)"; fi
}

# 2) A Supabase REST read that requires a valid public key (anon/publishable)
check_rest_read () { # name path expect(data|empty)
  local out code body
  out=$(curl -s -w $'\n%{http_code}' --max-time 20 "$SUPA_URL/rest/v1/$2" \
        -H "apikey: $KEY" -H "Authorization: Bearer $KEY")
  code=$(printf '%s' "$out" | tail -1)
  body=$(printf '%s' "$out" | sed '$d')
  if [ "$3" = "data" ]; then
    if [ "$code" = "200" ] && [ "$body" != "[]" ] && [ -n "$body" ]; then ok "$1" "HTTP $code, rows returned"
    else bad "$1" "HTTP $code, body=${body:0:40} (expected rows)"; fi
  else # expect empty/blocked
    if [ "$code" = "200" ] && [ "$body" = "[]" ]; then ok "$1" "HTTP $code, correctly empty"
    elif [ "$code" = "401" ] || [ "$code" = "403" ]; then ok "$1" "HTTP $code, correctly blocked"
    else bad "$1" "HTTP $code, body=${body:0:40} (expected empty/blocked)"; fi
  fi
}

# 3) An edge function should be reachable (deployed). 200/401/400 = alive; 404/5xx = broken.
check_edge_alive () { # name function
  local code; code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 -X OPTIONS \
        "$SUPA_URL/functions/v1/$2" -H "apikey: $KEY")
  case "$code" in
    200|201|204|400|401|403) ok "$1" "HTTP $code (deployed)";;
    *) bad "$1" "HTTP $code (expected function to be reachable)";;
  esac
}

echo "KStoryBridge rotation health check  ${DIM}(key: ${KEY:0:12}…, read-only)${RST}"
echo "-----------------------------------------------------------------------"
echo "Public sites"
check_http "marketing website"      "https://kstorybridge.com"
check_http "buyer dashboard"        "https://dashboard.kstorybridge.com"
check_http "creator app"            "https://creator.kstorybridge.com"
check_http "public title page"      "https://dashboard.kstorybridge.com/titles/reunion-1"
echo "Supabase public key (anon/publishable) path"
check_rest_read "read public_titles view"  "public_titles?select=title_id&limit=1"  data
check_rest_read "PII stays blocked (user_buyers)" "user_buyers?select=email&limit=1" empty
echo "Edge functions (secret/service_role path is exercised server-side)"
check_edge_alive "chat-orchestrator reachable" "chat-orchestrator"
check_edge_alive "create-checkout-session reachable" "create-checkout-session"
echo "-----------------------------------------------------------------------"
printf "Result: ${GREEN}%d passed${RST}, " "$pass"
if [ "$fail" -gt 0 ]; then printf "${RED}%d FAILED${RST}\n" "$fail"; exit 1
else printf "0 failed — all green\n"; exit 0; fi
