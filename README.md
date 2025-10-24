# KStoryBridge Monorepo

**Last Updated**: 2025-10-22

This monorepo contains three applications for the KStoryBridge platform: buyer dashboard, creator dashboard, and marketing website.

> 📖 **For detailed documentation**, see [CLAUDE.md](./CLAUDE.md) - Complete monorepo guide with architecture, workflows, and best practices.

---

## Applications

KStoryBridge uses a three-app architecture with separate applications for different user types:

| App | Directory | Port | Production URL | Purpose |
|-----|-----------|------|----------------|---------|
| **Dashboard** | `apps/dashboard` | 8081 | dashboard.kstorybridge.com | Buyer-focused features (AI chatbot, tier system, premium content) |
| **Creator** | `apps/creator` | 8082 | creator.kstorybridge.com | Creator-focused features (content management, pitch uploads) |
| **Website** | `apps/website` | 5173 | kstorybridge.com | Marketing site, authentication redirects |

---

## Quick Start

### Install Dependencies

```bash
npm install
```

### Development

Start individual apps:

```bash
# Buyer dashboard (port 8081)
npm run dev:dashboard

# Creator dashboard (port 8082)
npm run dev:creator

# Marketing website (port 5173)
npm run dev:website
```

**Local URLs**:
- Dashboard: http://localhost:8081
- Creator: http://localhost:8082
- Website: http://localhost:5173

### Build

```bash
# Build all applications
npm run build:all

# Build individual apps
npm run build:dashboard
npm run build:creator
npm run build:website
```

### Linting

```bash
# Lint all apps
npm run lint:all
```

---

## Monorepo Structure

```
kstorybridge/
├── apps/
│   ├── dashboard/          # Buyer dashboard (React + Vite)
│   ├── creator/            # Creator dashboard (React + Vite)
│   └── website/            # Marketing website (React + Vite)
├── packages/               # Shared libraries
│   ├── ui/                 # Shared UI components
│   ├── auth/               # Authentication utilities
│   ├── api-client/         # API client library
│   └── utils/              # Common utilities
├── docs/                   # Documentation
│   ├── active/             # Current documentation
│   ├── features/           # Feature-specific docs
│   └── guides/             # Setup and deployment guides
└── CLAUDE.md               # Primary documentation (START HERE)
```

---

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui + Radix UI
- **Backend**: Supabase (auth, database, edge functions)
- **State Management**: TanStack Query + React Context
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Deployment**: Vercel (4 projects: dashboard-staging, dashboard, creator, website)

---

## Git Workflow

### Branch Strategy

| Branch | Environment | Deploys To |
|--------|-------------|------------|
| **v2** | Staging | dashboard-staging (staging.kstorybridge.com) |
| **main** | Production | All apps (dashboard, creator, website) |

### Development Workflow

```bash
# 1. Work on v2 branch
git checkout v2

# 2. Make changes and push to staging
git add .
git commit -m "feat: your feature"
git push origin v2

# 3. Test on staging.kstorybridge.com

# 4. When stable, merge to production
git checkout main
git merge v2
git push origin main
```

**See**: [docs/guides/GIT_DEPLOYMENT_STRUCTURE.md](docs/guides/GIT_DEPLOYMENT_STRUCTURE.md) for complete deployment guide.

---

## Documentation

### Essential Documentation

Start here for comprehensive guidance:

**[CLAUDE.md](./CLAUDE.md)** - Master documentation file covering:
- Complete architecture overview
- Development workflow
- Authentication system
- Database schema
- Design standards
- Deployment strategy
- Troubleshooting

### App-Specific Guides

- **[Dashboard](apps/dashboard/CLAUDE.md)** - Buyer dashboard, tier system, AI chatbot
- **[Creator](apps/creator/CLAUDE.md)** - Creator dashboard, content management
- **[Website](apps/website/CLAUDE.md)** - Marketing site, preview pages

### System Documentation

Located in `docs/active/`:
- **AUTH_DOCUMENTATION.md** - Complete auth system reference
- **DATABASE_SCHEMA.md** - Database schema and query patterns
- **DESIGN_SYSTEM.md** - UI/UX standards and components
- **CACHE_POLICY.md** - Session-based caching implementation

### Deployment Guides

Located in `docs/guides/`:
- **GIT_DEPLOYMENT_STRUCTURE.md** - Complete Git deployment configuration
- **DEPLOYMENT_STRATEGY.md** - Deployment architecture and workflows
- **DEPLOYMENT_INSTRUCTIONS.md** - Step-by-step deployment procedures

---

## Common Commands Reference

### Development

```bash
npm run dev:dashboard     # Start dashboard (localhost:8081)
npm run dev:creator       # Start creator (localhost:8082)
npm run dev:website       # Start website (localhost:5173)
```

### Building

```bash
npm run build:all         # Build all apps + packages
npm run build:packages    # Build shared packages only
npm run build:dashboard   # Build dashboard only
npm run build:creator     # Build creator only
npm run build:website     # Build website only
```

### Testing & Quality

```bash
npm run lint:all          # Lint all apps
npm run test:all          # Run all tests
npm run test:watch        # Watch mode testing
npm run test:coverage     # Generate coverage reports
```

### Maintenance

```bash
npm run clean:all         # Clean all build artifacts
npm install               # Install/update all dependencies
```

---

## Key Features

### Dashboard App (Buyers)
- 🤖 AI Chatbot (OpenAI-powered title discovery)
- 🎯 Tier System (Basic, Pro, Suite)
- 📊 Premium Content (Pitch decks, analytics)
- 💳 Stripe Integration (Subscription management)
- 🔍 Advanced Search & Filtering

### Creator App (Creators)
- 📝 Content Management (Title submissions, editing)
- 📤 Pitch Deck Uploads (Automated extraction)
- 📈 Analytics Dashboard (Views, requests, performance)
- 💬 Request Management (Buyer inquiries)
- 🎨 Portfolio Management

### Website App (Marketing)
- 🌐 Marketing Pages (Home, About, Pricing)
- 🔐 Auth Redirects (Routes to dashboard/creator)
- 📱 Responsive Design
- 🌍 Bilingual Support (English/Korean)

---

## Environment Setup

### Required Environment Variables

Each app requires a `.env.local` file (never committed):

```env
# Supabase (shared across all apps)
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# App-specific URLs
VITE_DASHBOARD_URL=http://localhost:8081
VITE_CREATOR_URL=http://localhost:8082
VITE_WEBSITE_URL=http://localhost:5173

# Feature flags (dashboard only)
VITE_OPENAI_ENABLED=true
VITE_DEBUG_MODE=true
```

**See**: `CLAUDE.md` for complete environment variable documentation.

---

## Contributing

### Before Making Changes

1. Read [CLAUDE.md](./CLAUDE.md) - Primary documentation
2. Check app-specific CLAUDE.md in `apps/*/CLAUDE.md`
3. Review [DESIGN_SYSTEM.md](docs/active/DESIGN_SYSTEM.md) for UI standards
4. Understand authentication flow in [AUTH_DOCUMENTATION.md](docs/active/AUTH_DOCUMENTATION.md)

### Development Guidelines

- ✅ Always develop on `v2` branch
- ✅ Test locally before pushing
- ✅ Follow design system standards (no yellow colors, use Standard components)
- ✅ Use snake_case for database field names
- ✅ Query users by `email`, never by `user_id`
- ❌ Never commit `.env` files
- ❌ Never use OAuth URL parameters
- ❌ Never edit auto-generated files (`types.ts`, `ui/` components)

### Documentation Updates

When making structural changes:
- Update relevant CLAUDE.md files
- Update DATABASE_SCHEMA.md if database changes
- Update "Last Updated" dates
- Add migration documentation if applicable

---

## Support & Resources

### Development Resources
- Supabase Project: https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd
- Vercel Dashboard: https://vercel.com/dashboard

### Production URLs
- Dashboard: https://dashboard.kstorybridge.com
- Creator: https://creator.kstorybridge.com (🚧 Configured, not yet deployed)
- Website: https://kstorybridge.com

### Staging URL
- Dashboard Staging: https://staging.kstorybridge.com

---

## Repository Information

- **Repository**: https://github.com/creepyblues/kstorybridge-integrated
- **Primary Branch**: `v2` (development/staging)
- **Production Branch**: `main`
- **Working Directory**: `/Users/sungholee/code/kstorybridge`

---

**For detailed information, always refer to [CLAUDE.md](./CLAUDE.md) - the master documentation file.**
