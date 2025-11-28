#!/bin/bash

# Phase 2 Enhanced Personality Testing - Quick Start Script
#
# This script automates the A/B testing process for Phase 2 enhanced personality

set -e  # Exit on error

echo "🚀 Phase 2 Enhanced Personality A/B Testing"
echo "============================================"
echo ""

# Check for required environment variables
if [ -z "$TEST_EMAIL" ] || [ -z "$TEST_PASSWORD" ]; then
    echo "❌ Error: TEST_EMAIL and TEST_PASSWORD environment variables are required"
    echo ""
    echo "Please set them before running this script:"
    echo ""
    echo "  export TEST_EMAIL='your-test-buyer@example.com'"
    echo "  export TEST_PASSWORD='your-test-password'"
    echo ""
    echo "Then run this script again:"
    echo "  ./run-phase-2-tests.sh"
    echo ""
    exit 1
fi

echo "✅ Environment variables found"
echo "   Email: $TEST_EMAIL"
echo ""

# Optional: Override anon key if needed
if [ -n "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "ℹ️  Using custom VITE_SUPABASE_ANON_KEY from environment"
    echo ""
fi

# Verify Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo ""
    echo "Install with:"
    echo "  npm install -g supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Step 1: Ensure flag is set to FALSE for baseline testing
echo "📋 Step 1: Setting flag to FALSE for baseline testing..."
npx supabase secrets set ENABLE_NEW_PERSONALITY=false --project-ref dlrnrgcoguxlkkcitlpd

echo "✅ Flag set to FALSE"
echo ""

# Wait for edge function to reload
echo "⏳ Waiting 30 seconds for edge function to reload..."
sleep 30

# Step 2: Run the automated test script
echo ""
echo "📋 Step 2: Running fully automated A/B tests..."
echo ""
echo "The script will automatically:"
echo "  1. Test 15 queries with ORIGINAL personality (flag OFF)"
echo "  2. Enable the ENABLE_NEW_PERSONALITY flag via Supabase CLI"
echo "  3. Wait for edge function reload"
echo "  4. Test 15 queries with ENHANCED personality (flag ON)"
echo "  5. Save all results to JSON file"
echo ""
echo "Total runtime: ~45 minutes"
echo ""
echo "Press Ctrl+C to cancel, or press Enter to continue..."
read

# Run the Node.js test script
node test-phase-2-personality.js

echo ""
echo "✅ Testing complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Review the generated JSON results file"
echo "  2. Score responses using PHASE_2_TESTING_GUIDE.md criteria"
echo "  3. Calculate improvement percentages"
echo "  4. Create PHASE_2_TEST_RESULTS.md with findings"
echo ""
