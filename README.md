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
