#!/bin/bash

# Admin Portal Development Environment Setup Script
# This script helps configure the local development environment

set -e

echo "🔧 Setting up Admin Portal development environment..."
echo ""

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists"
    echo ""
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [[ $overwrite != "y" && $overwrite != "Y" ]]; then
        echo "❌ Setup cancelled"
        exit 1
    fi
fi

# Copy example file
if [ -f ".env.local.example" ]; then
    cp .env.local.example .env.local
    echo "✅ Copied .env.local.example to .env.local"
else
    echo "❌ .env.local.example not found"
    exit 1
fi

echo ""
echo "🔐 Configure Admin Development Credentials:"
echo ""

# Get admin email
read -p "Enter admin email (e.g., admin@example.com): " admin_email
if [ -z "$admin_email" ]; then
    echo "❌ Admin email is required"
    exit 1
fi

# Get admin password (hidden input)
echo -n "Enter admin password: "
read -s admin_password
echo ""

if [ -z "$admin_password" ]; then
    echo "❌ Admin password is required"
    exit 1
fi

# Update .env.local with credentials
sed -i.bak "s/VITE_DEV_ADMIN_EMAIL=your_admin_email_here/VITE_DEV_ADMIN_EMAIL=$admin_email/" .env.local
sed -i.bak "s/VITE_DEV_ADMIN_PASSWORD=your_admin_password_here/VITE_DEV_ADMIN_PASSWORD=$admin_password/" .env.local

# Remove backup file
rm .env.local.bak

echo ""
echo "✅ Environment configured successfully!"
echo ""
echo "🚀 Next steps:"
echo "   1. npm run dev           (start development server)"
echo "   2. Open http://localhost:8082"
echo "   3. Auto-login will use configured credentials"
echo ""
echo "⚠️  Security Note:"
echo "   These credentials only work on localhost in development mode"
echo "   They are automatically blocked in production environments"
echo ""