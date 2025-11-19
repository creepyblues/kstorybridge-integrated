#!/bin/bash
# Vercel Selective Build Script for Turborepo Monorepo
# Enhanced wrapper around turbo-ignore with explicit workspace detection
#
# Usage (from repository root): bash scripts/vercel-ignore-turbo.sh [app-name]
# Usage (from app directory): cd ../.. && bash scripts/vercel-ignore-turbo.sh
# Exit codes:
#   0 = No changes detected, skip build
#   1 = Changes detected, proceed with build

# Enable debugging output
set -x

# Detect app name from parameter or current directory
if [ -n "$1" ]; then
  # App name provided as parameter (when run from repo root)
  APP_NAME="$1"
  echo "Using app name from parameter: $APP_NAME"

  # Verify we're in monorepo root
  if [ ! -f "turbo.json" ]; then
    echo "Error: turbo.json not found - not in monorepo root"
    echo "Current directory: $(pwd)"
    exit 1
  fi
else
  # No parameter - detect from current directory (original behavior)
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
