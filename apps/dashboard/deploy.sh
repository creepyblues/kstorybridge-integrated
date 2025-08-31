#!/bin/bash

echo "🚀 Manual Vercel Deployment Script"
echo "=================================="
echo ""
echo "To use this script:"
echo "1. Get your Vercel token from: https://vercel.com/account/tokens"
echo "2. Create a new token with 'Full Access'"
echo "3. Run: VERCEL_TOKEN=your_token_here ./deploy.sh"
echo ""

if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ Error: VERCEL_TOKEN environment variable not set"
    echo "Please set it with: export VERCEL_TOKEN=your_token_here"
    exit 1
fi

echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "🚀 Deploying to Vercel..."
vercel --prod --token=$VERCEL_TOKEN --yes

echo "✅ Deployment complete!"