#!/bin/bash
# check-app-changes.sh - Custom script for Vercel selective deployment
# Usage: bash scripts/check-app-changes.sh <app-path>
# Example: bash scripts/check-app-changes.sh apps/creator
#
# Exit codes:
#   0 - No changes detected (cancel build)
#   1 - Changes detected (proceed with build)

set -e

APP_PATH="$1"

if [ -z "$APP_PATH" ]; then
  echo "❌ Error: No app path provided"
  echo "Usage: bash scripts/check-app-changes.sh <app-path>"
  echo "Example: bash scripts/check-app-changes.sh apps/creator"
  exit 1
fi

# Validate app path exists
if [ ! -d "$APP_PATH" ]; then
  echo "❌ Error: Directory '$APP_PATH' does not exist"
  exit 1
fi

echo "🔍 Checking for changes in: $APP_PATH"

# Get the previous commit (HEAD^)
PREV_COMMIT="HEAD^"

# Check if HEAD^ exists (not first commit)
if ! git rev-parse "$PREV_COMMIT" >/dev/null 2>&1; then
  echo "⚠️  No previous commit found (first deployment)"
  echo "✓ Proceeding with build (safety fallback)"
  exit 1
fi

# Get changed files between HEAD^ and HEAD
CHANGED_FILES=$(git diff --name-only "$PREV_COMMIT" HEAD)

if [ -z "$CHANGED_FILES" ]; then
  echo "⚠️  No changed files detected"
  echo "⏭ Skipping build (no changes)"
  exit 0
fi

echo "📝 Changed files:"
echo "$CHANGED_FILES" | sed 's/^/  - /'

# Check if any files in app path changed
if echo "$CHANGED_FILES" | grep -q "^$APP_PATH/"; then
  echo ""
  echo "✅ Changes detected in $APP_PATH"
  echo "✓ Proceeding with build"
  exit 1
else
  echo ""
  echo "⏭ No changes in $APP_PATH"
  echo "⏭ Skipping build"
  exit 0
fi
