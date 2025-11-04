#!/bin/bash

# Phase 1 Dependency Installation Script
# Run this from the dashboard-v2 directory

echo "📦 Installing Phase 1 Dependencies for Dashboard-v2..."
echo ""
echo "This will install:"
echo "  - react-pdf (PDF rendering library)"
echo "  - pdfjs-dist (PDF.js worker)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the dashboard-v2 directory."
    exit 1
fi

# Check if this is the dashboard-v2 directory
if ! grep -q '"name": "dashboard-v2"' package.json; then
    echo "❌ Error: This doesn't appear to be the dashboard-v2 directory."
    echo "Please cd to /Users/sungholee/code/kstorybridge/apps/dashboard-v2 and run again."
    exit 1
fi

echo "✅ Confirmed: Running in dashboard-v2 directory"
echo ""

# Install dependencies
echo "📦 Running: npm install react-pdf pdfjs-dist"
npm install react-pdf pdfjs-dist

# Check if installation succeeded
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Phase 1 dependencies installed successfully!"
    echo ""
    echo "Installed packages:"
    npm list react-pdf pdfjs-dist 2>/dev/null || true
    echo ""
    echo "🎯 Next steps:"
    echo "  1. SecurePDFViewer component has been copied"
    echo "  2. PremiumFeaturePopup component has been copied"
    echo "  3. pdfConfig.ts has been created"
    echo "  4. Continue with Phase 1 integration"
    echo ""
else
    echo ""
    echo "❌ Installation failed. Please check the error messages above."
    exit 1
fi
