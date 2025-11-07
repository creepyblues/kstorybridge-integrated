#!/bin/bash
#
# Vercel Deployment Script - Selective Build for Turborepo Monorepo
#
# This script wraps turbo-ignore to determine if an app should be built.
# Used in Vercel's "Ignored Build Step" setting.
#
# Usage: bash scripts/check-app-changes.sh apps/[app-name]
#
# Exit codes:
#   0 - Skip build (no changes detected)
#   1 - Proceed with build (changes detected)
#
# Documentation: docs/guides/TURBOREPO_VERCEL_SETUP.md

set -e

# Navigate to monorepo root (in case script is called from subdirectory)
cd "$(dirname "$0")/.."

# Run turbo-ignore with all arguments passed through
# turbo-ignore automatically detects the app context from Vercel environment
npx turbo-ignore "$@"
