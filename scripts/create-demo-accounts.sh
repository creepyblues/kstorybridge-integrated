#!/usr/bin/env bash
#
# Creates shareable demo accounts (buyer + creator) on production.
# Idempotent — safe to re-run; edge functions skip existing profiles.
#
# Usage:
#   SUPABASE_SERVICE_ROLE_KEY="your-key" bash scripts/create-demo-accounts.sh
#

set -euo pipefail

# --- Config ---
SUPABASE_URL="https://dlrnrgcoguxlkkcitlpd.supabase.co"
BUYER_EMAIL="demo-buyer@kstorybridge.com"
CREATOR_EMAIL="demo-creator@kstorybridge.com"
PASSWORD="KStoryDemo2026!"

if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "ERROR: SUPABASE_SERVICE_ROLE_KEY env var is required."
  echo "Usage: SUPABASE_SERVICE_ROLE_KEY=\"your-key\" bash scripts/create-demo-accounts.sh"
  exit 1
fi

AUTH_HEADER="Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
APIKEY_HEADER="apikey: ${SUPABASE_SERVICE_ROLE_KEY}"
CONTENT_TYPE="Content-Type: application/json"

echo "=== Creating Demo Accounts ==="
echo ""

# -------------------------------------------------------
# 1. Create buyer auth user
# -------------------------------------------------------
echo "[1/4] Creating buyer auth user (${BUYER_EMAIL})..."

BUYER_RESPONSE=$(curl -s -w "\n%{http_code}" \
  "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "${AUTH_HEADER}" \
  -H "${APIKEY_HEADER}" \
  -H "${CONTENT_TYPE}" \
  -d "{
    \"email\": \"${BUYER_EMAIL}\",
    \"password\": \"${PASSWORD}\",
    \"email_confirm\": true,
    \"user_metadata\": {
      \"account_type\": \"buyer\",
      \"full_name\": \"Demo Buyer\"
    }
  }")

BUYER_HTTP_CODE=$(echo "$BUYER_RESPONSE" | tail -1)
BUYER_BODY=$(echo "$BUYER_RESPONSE" | sed '$d')

if [ "$BUYER_HTTP_CODE" -ge 200 ] && [ "$BUYER_HTTP_CODE" -lt 300 ]; then
  BUYER_USER_ID=$(echo "$BUYER_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "  OK — user ID: ${BUYER_USER_ID}"
elif echo "$BUYER_BODY" | grep -q "already been registered"; then
  echo "  SKIP — user already exists, fetching ID..."
  # Look up existing user by email
  EXISTING=$(curl -s \
    "${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1" \
    -H "${AUTH_HEADER}" \
    -H "${APIKEY_HEADER}" \
    -G --data-urlencode "filter=email eq ${BUYER_EMAIL}")
  # Try parsing from users array; fall back to listing all and grep
  BUYER_USER_ID=$(echo "$EXISTING" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -z "$BUYER_USER_ID" ]; then
    # Fallback: list and search
    ALL_USERS=$(curl -s "${SUPABASE_URL}/auth/v1/admin/users" \
      -H "${AUTH_HEADER}" \
      -H "${APIKEY_HEADER}")
    BUYER_USER_ID=$(echo "$ALL_USERS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
users = data if isinstance(data, list) else data.get('users', [])
for u in users:
    if u.get('email') == '${BUYER_EMAIL}':
        print(u['id'])
        break
" 2>/dev/null || true)
  fi
  if [ -z "$BUYER_USER_ID" ]; then
    echo "  ERROR — could not find existing buyer user ID"
    exit 1
  fi
  echo "  Found existing user ID: ${BUYER_USER_ID}"
else
  echo "  ERROR (HTTP ${BUYER_HTTP_CODE}): ${BUYER_BODY}"
  exit 1
fi

# -------------------------------------------------------
# 2. Create buyer profile via edge function
# -------------------------------------------------------
echo "[2/4] Creating buyer profile..."

BUYER_PROFILE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  "${SUPABASE_URL}/functions/v1/create-buyer-profile" \
  -H "${AUTH_HEADER}" \
  -H "${APIKEY_HEADER}" \
  -H "${CONTENT_TYPE}" \
  -d "{
    \"userId\": \"${BUYER_USER_ID}\",
    \"email\": \"${BUYER_EMAIL}\",
    \"fullName\": \"Demo Buyer\",
    \"buyerCompany\": \"Demo Company\",
    \"buyerRole\": \"producer\",
    \"tier\": \"basic\"
  }")

BUYER_PROFILE_CODE=$(echo "$BUYER_PROFILE_RESPONSE" | tail -1)
BUYER_PROFILE_BODY=$(echo "$BUYER_PROFILE_RESPONSE" | sed '$d')

if echo "$BUYER_PROFILE_BODY" | grep -q '"success":true'; then
  echo "  OK — $(echo "$BUYER_PROFILE_BODY" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)"
else
  echo "  ERROR (HTTP ${BUYER_PROFILE_CODE}): ${BUYER_PROFILE_BODY}"
  exit 1
fi

# -------------------------------------------------------
# 3. Create creator auth user
# -------------------------------------------------------
echo "[3/4] Creating creator auth user (${CREATOR_EMAIL})..."

CREATOR_RESPONSE=$(curl -s -w "\n%{http_code}" \
  "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "${AUTH_HEADER}" \
  -H "${APIKEY_HEADER}" \
  -H "${CONTENT_TYPE}" \
  -d "{
    \"email\": \"${CREATOR_EMAIL}\",
    \"password\": \"${PASSWORD}\",
    \"email_confirm\": true,
    \"user_metadata\": {
      \"account_type\": \"creator\",
      \"full_name\": \"Demo Creator\"
    }
  }")

CREATOR_HTTP_CODE=$(echo "$CREATOR_RESPONSE" | tail -1)
CREATOR_BODY=$(echo "$CREATOR_RESPONSE" | sed '$d')

if [ "$CREATOR_HTTP_CODE" -ge 200 ] && [ "$CREATOR_HTTP_CODE" -lt 300 ]; then
  CREATOR_USER_ID=$(echo "$CREATOR_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "  OK — user ID: ${CREATOR_USER_ID}"
elif echo "$CREATOR_BODY" | grep -q "already been registered"; then
  echo "  SKIP — user already exists, fetching ID..."
  EXISTING=$(curl -s \
    "${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1" \
    -H "${AUTH_HEADER}" \
    -H "${APIKEY_HEADER}" \
    -G --data-urlencode "filter=email eq ${CREATOR_EMAIL}")
  CREATOR_USER_ID=$(echo "$EXISTING" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -z "$CREATOR_USER_ID" ]; then
    ALL_USERS=$(curl -s "${SUPABASE_URL}/auth/v1/admin/users" \
      -H "${AUTH_HEADER}" \
      -H "${APIKEY_HEADER}")
    CREATOR_USER_ID=$(echo "$ALL_USERS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
users = data if isinstance(data, list) else data.get('users', [])
for u in users:
    if u.get('email') == '${CREATOR_EMAIL}':
        print(u['id'])
        break
" 2>/dev/null || true)
  fi
  if [ -z "$CREATOR_USER_ID" ]; then
    echo "  ERROR — could not find existing creator user ID"
    exit 1
  fi
  echo "  Found existing user ID: ${CREATOR_USER_ID}"
else
  echo "  ERROR (HTTP ${CREATOR_HTTP_CODE}): ${CREATOR_BODY}"
  exit 1
fi

# -------------------------------------------------------
# 4. Create creator profile via edge function
# -------------------------------------------------------
echo "[4/4] Creating creator profile..."

CREATOR_PROFILE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  "${SUPABASE_URL}/functions/v1/create-creator-profile" \
  -H "${AUTH_HEADER}" \
  -H "${APIKEY_HEADER}" \
  -H "${CONTENT_TYPE}" \
  -d "{
    \"userId\": \"${CREATOR_USER_ID}\",
    \"email\": \"${CREATOR_EMAIL}\",
    \"fullName\": \"Demo Creator\",
    \"penName\": \"Demo Author\",
    \"ipOwnerRole\": \"author\"
  }")

CREATOR_PROFILE_CODE=$(echo "$CREATOR_PROFILE_RESPONSE" | tail -1)
CREATOR_PROFILE_BODY=$(echo "$CREATOR_PROFILE_RESPONSE" | sed '$d')

if echo "$CREATOR_PROFILE_BODY" | grep -q '"success":true'; then
  echo "  OK — $(echo "$CREATOR_PROFILE_BODY" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)"
else
  echo "  ERROR (HTTP ${CREATOR_PROFILE_CODE}): ${CREATOR_PROFILE_BODY}"
  exit 1
fi

# -------------------------------------------------------
# Done
# -------------------------------------------------------
echo ""
echo "=== Done ==="
echo ""
echo "Demo accounts ready:"
echo "  Buyer:   ${BUYER_EMAIL} / ${PASSWORD}"
echo "  Creator: ${CREATOR_EMAIL} / ${PASSWORD}"
echo ""
echo "Sign in at:"
echo "  Buyer:   https://dashboard.kstorybridge.com"
echo "  Creator: https://creator.kstorybridge.com"
