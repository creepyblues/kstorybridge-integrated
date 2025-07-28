#!/bin/bash

echo "🚀 KStoryBridge PDF Pitch Upload Script"
echo "========================================"
echo ""

# Check if SUPABASE_SERVICE_ROLE_KEY is set
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set"
    echo ""
    echo "Please set it with:"
    echo "export SUPABASE_SERVICE_ROLE_KEY=\"your_service_role_key_here\""
    echo ""
    echo "You can find your service role key in:"
    echo "Supabase Dashboard > Settings > API > service_role (secret)"
    echo ""
    exit 1
fi

echo "✅ Environment variable SUPABASE_SERVICE_ROLE_KEY is set"
echo ""

# Check if pitches directory exists
if [ ! -d "../../pitches" ]; then
    echo "❌ Error: pitches directory not found at ../../pitches"
    echo "Please ensure the pitches directory exists with PDF files"
    exit 1
fi

PDF_COUNT=$(find ../../pitches -name "*.pdf" -type f | wc -l)
echo "📁 Found $PDF_COUNT PDF files in pitches directory"
echo ""

# Ask for confirmation
echo "⚠️  This script will:"
echo "   1. Upload all $PDF_COUNT PDF files to Supabase storage 'pitch-pdfs' bucket"
echo "   2. Match them with titles in the database using fuzzy string matching"
echo "   3. Update the 'pitch' column for matched titles"
echo ""
read -p "Do you want to continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operation cancelled"
    exit 1
fi

echo ""
echo "🔄 Starting upload process..."
echo ""

# Run the Node.js script
node upload-pitches.js

echo ""
echo "🏁 Upload process completed!"