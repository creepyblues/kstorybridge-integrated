#!/bin/bash
# Vercel Selective Build Script for Turborepo Monorepo
# Enhanced wrapper around turbo-ignore with debugging and auto-detection
#
# Usage: cd ../.. && bash scripts/vercel-ignore-turbo.sh
# Exit codes:
#   0 = No changes detected, skip build
#   1 = Changes detected, proceed with build

# Enable debugging output
set -x

# Verify we're in monorepo root
if [ ! -f "turbo.json" ]; then
  echo "Error: turbo.json not found - not in monorepo root"
  echo "Current directory: $(pwd)"
  exit 1
fi

# Run turbo-ignore (auto-detects workspace from package.json)
echo "Running turbo-ignore with auto-detection..."
npx turbo-ignore

# Capture exit code
EXIT_CODE=$?

# Debug output
if [ $EXIT_CODE -eq 0 ]; then
  echo "✓ No changes detected - skipping build"
else
  echo "✓ Changes detected - proceeding with build"
fi

exit $EXIT_CODE
