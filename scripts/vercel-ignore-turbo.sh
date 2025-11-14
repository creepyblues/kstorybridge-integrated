#!/bin/bash
# Vercel Selective Build Script for Turborepo Monorepo
# Enhanced wrapper around turbo-ignore with explicit workspace detection
#
# Usage: cd ../.. && bash scripts/vercel-ignore-turbo.sh
# Exit codes:
#   0 = No changes detected, skip build
#   1 = Changes detected, proceed with build

# Enable debugging output
set -x

# Store the original directory (Vercel starts in apps/[app-name]/)
ORIGINAL_DIR=$(pwd)
APP_NAME=$(basename "$ORIGINAL_DIR")

echo "Detected app directory: $APP_NAME"
echo "Original directory: $ORIGINAL_DIR"

# Navigate to monorepo root
cd ../..

# Verify we're in monorepo root
if [ ! -f "turbo.json" ]; then
  echo "Error: turbo.json not found - not in monorepo root"
  echo "Current directory: $(pwd)"
  exit 1
fi

# Map directory name to workspace package name
case "$APP_NAME" in
  "dashboard")
    WORKSPACE="@kstorybridge/dashboard"
    ;;
  "dashboard-next")
    WORKSPACE="@kstorybridge/dashboard-next"
    ;;
  "creator")
    WORKSPACE="@kstorybridge/creator"
    ;;
  "website")
    WORKSPACE="@kstorybridge/website"
    ;;
  *)
    echo "Error: Unknown app directory: $APP_NAME"
    echo "Cannot determine workspace name"
    echo "Proceeding with build as fallback"
    exit 1
    ;;
esac

# Run turbo-ignore with explicit workspace name
echo "Running turbo-ignore for workspace: $WORKSPACE"
npx turbo-ignore "$WORKSPACE"

# Capture exit code
EXIT_CODE=$?

# Debug output
if [ $EXIT_CODE -eq 0 ]; then
  echo "✓ No changes detected in $WORKSPACE - skipping build"
else
  echo "✓ Changes detected in $WORKSPACE - proceeding with build"
fi

exit $EXIT_CODE
