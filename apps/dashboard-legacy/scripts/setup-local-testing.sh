#!/bin/bash

# Local Testing Environment Setup Script
# This script sets up a complete localhost OAuth testing environment

echo "🚀 Setting up Local OAuth Testing Environment"
echo "============================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Supabase CLI is installed
if ! command_exists supabase; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
else
    echo "✅ Supabase CLI found"
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found. Creating from example..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local"
    echo "⚠️  Please edit .env.local to configure your local environment"
else
    echo "✅ .env.local found"
fi

# Check Docker status for Supabase
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
else
    echo "✅ Docker is running"
fi

echo ""
echo "🔧 Configuration Options:"
echo ""
echo "Option 1: Full Local Environment"
echo "  1. Uncomment VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local"
echo "  2. Run: npx supabase start"
echo "  3. Configure OAuth providers in Local Studio (http://localhost:54324)"
echo ""
echo "Option 2: Hybrid Testing (Production DB + Local Apps)"
echo "  1. Keep .env.local as-is (uses production Supabase)"
echo "  2. Add localhost URLs to production OAuth settings"
echo ""

read -p "Do you want to start Local Supabase now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting Local Supabase..."
    cd supabase
    npx supabase start
    echo ""
    echo "✅ Local Supabase started!"
    echo "🎨 Studio URL: http://localhost:54324"
    echo "📡 API URL: http://localhost:54321"
    echo ""
    echo "Next Steps:"
    echo "1. Configure OAuth providers in Studio"
    echo "2. Update .env.local with local Supabase credentials"
    echo "3. Run npm run dev to start the dashboard"
fi

echo ""
echo "📚 For detailed instructions, see:"
echo "   - LOCALHOST_TESTING_SETUP.md"
echo "   - CLAUDE.md (Local Testing Environment section)"