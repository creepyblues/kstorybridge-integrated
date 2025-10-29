#!/bin/bash

echo "🚀 Merging KStoryBridge repositories into monorepo..."

# Navigate to parent directory
cd /Users/sungholee/code

# Create new monorepo structure
echo "📁 Creating monorepo structure..."
mkdir -p kstorybridge-monorepo/apps
mkdir -p kstorybridge-monorepo/packages

# Move current dashboard app to apps/dashboard
echo "📦 Moving dashboard app..."
cp -r dashboard-kstorybridge-main kstorybridge-monorepo/apps/dashboard

# Move main site to apps/website  
echo "🌐 Moving website app..."
cp -r story-bridge-site-main kstorybridge-monorepo/apps/website

# Navigate to new monorepo
cd kstorybridge-monorepo

# Create root package.json for monorepo
echo "📄 Creating root package.json..."
cat > package.json << 'EOF'
{
  "name": "kstorybridge-monorepo",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev:dashboard": "npm run dev --workspace=apps/dashboard",
    "dev:website": "npm run dev --workspace=apps/website",
    "build:dashboard": "npm run build --workspace=apps/dashboard",
    "build:website": "npm run build --workspace=apps/website",
    "build:all": "npm run build:dashboard && npm run build:website",
    "lint:all": "npm run lint --workspace=apps/dashboard && npm run lint --workspace=apps/website",
    "install:all": "npm install"
  },
  "devDependencies": {
    "@types/node": "^22.5.5",
    "typescript": "^5.5.3"
  }
}
EOF

# Update package.json names to avoid conflicts
echo "🔧 Updating package names..."
cd apps/dashboard
npm pkg set name="@kstorybridge/dashboard"
cd ../website  
npm pkg set name="@kstorybridge/website"
cd ../..

# Create root README
echo "📝 Creating root README..."
cat > README.md << 'EOF'
# KStoryBridge Monorepo

This monorepo contains both the main website and dashboard applications for KStoryBridge.

## Applications

- **Website** (`apps/website`) - Main marketing site for kstorybridge.com
- **Dashboard** (`apps/dashboard`) - Admin dashboard for dashboard.kstorybridge.com

## Development

```bash
# Install all dependencies
npm install

# Start dashboard development server
npm run dev:dashboard

# Start website development server  
npm run dev:website

# Build all applications
npm run build:all

# Run linting on all apps
npm run lint:all
```

## Structure

- `apps/` - Applications
- `packages/` - Shared packages and libraries
EOF

# Create root tsconfig.json
echo "⚙️ Creating root TypeScript config..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@dashboard/*": ["./apps/dashboard/src/*"],
      "@website/*": ["./apps/website/src/*"],
      "@shared/*": ["./packages/*/src/*"]
    }
  }
}
EOF

echo "✅ Monorepo created successfully!"
echo ""
echo "Next steps:"
echo "1. cd kstorybridge-monorepo"
echo "2. npm install"
echo "3. npm run dev:dashboard  # or npm run dev:website"
echo ""
echo "🎉 Your repositories are now merged!"