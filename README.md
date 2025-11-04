# KStoryBridge Monorepo

**Last Updated**: 2025-11-02

This monorepo contains three applications for the KStoryBridge platform: buyer dashboard, creator dashboard, and marketing website.

> 📖 **For detailed documentation**, see [CLAUDE.md](./CLAUDE.md) - Complete monorepo guide with architecture, workflows, and best practices.

---

## Applications

KStoryBridge uses a three-app architecture with separate applications for different user types:

| App | Directory | Port | Production URL | Purpose |
|-----|-----------|------|----------------|---------|
| **Dashboard** | `apps/dashboard` | 8081 | dashboard.kstorybridge.com | Buyer-focused features (AI chatbot, tier system, premium content) |
| **Creator** | `apps/creator` | 8083 | creator.kstorybridge.com | Creator-focused features (content management, pitch uploads) |
| **Website** | `apps/website` | 5173 | kstorybridge.com | Marketing site, authentication redirects |

---

## Quick Start

### Install Dependencies

```bash
npm install
```

### Development

Start apps (powered by Turborepo):

```bash
# Start all apps in parallel
npm run dev

# Or start individual apps
npm run dev:dashboard     # Dashboard only (port 8081)
npm run dev:creator       # Creator only (port 8083)
npm run dev:website       # Website only (port 5173)
```

**Local URLs**:
- Dashboard: http://localhost:8081
- Creator: http://localhost:8083
- Website: http://localhost:5173

### Build

**With intelligent caching** (Turborepo - ~50x faster on cached builds):

```bash
# Build all applications (with dependency graph)
npm run build

# Build individual apps
npm run build:dashboard   # Dashboard only
npm run build:creator     # Creator only
npm run build:website     # Website only
npm run build:packages    # Shared packages only
```

**Performance**: Second builds complete in ~80ms vs 4+ seconds!

### Linting

```bash
# Lint all apps (parallel execution)
npm run lint
```

---

## Monorepo Structure

```
kstorybridge/
├── apps/
│   ├── dashboard/          # Buyer dashboard (React + Vite)
│   ├── creator-v2/         # Creator dashboard (React + Vite)
│   ├── creator-v1/         # 🗄️ ARCHIVED - Legacy creator (reference only)
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
- **Build System**: Turborepo (monorepo orchestration, intelligent caching, ~50x faster builds)
- **Deployment**: Vercel (5 projects with selective deployment via turbo-ignore)

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

# 4. When stable, create pull request for production
# Option A: GitHub CLI
gh pr create --base main --head v2 --title "Deploy v2 to production"

# Option B: GitHub Web UI
# - Go to GitHub repository
# - Create pull request: v2 → main
# - Get approval and merge
```

**Note**: The `main` branch has protection enabled and requires pull requests. Direct pushes are blocked.

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
- **TURBOREPO_VERCEL_SETUP.md** - Turborepo + Vercel selective deployment guide
- **GIT_DEPLOYMENT_STRUCTURE.md** - Complete Git deployment configuration
- **DEPLOYMENT_STRATEGY.md** - Deployment architecture and workflows
- **DEPLOYMENT_INSTRUCTIONS.md** - Step-by-step deployment procedures

---

## Common Commands Reference

### Development (Turborepo)

```bash
npm run dev               # Start all apps in parallel
npm run dev:dashboard     # Start dashboard only (localhost:8081)
npm run dev:creator       # Start creator only (localhost:8083)
npm run dev:website       # Start website only (localhost:5173)
```

### Building (with Intelligent Caching)

```bash
npm run build             # Build all apps (with dependency graph)
npm run build:packages    # Build shared packages only
npm run build:dashboard   # Build dashboard only (~50x faster cached)
npm run build:creator     # Build creator only (~50x faster cached)
npm run build:website     # Build website only (~50x faster cached)
```

**Turborepo Performance**: Cached builds complete in ~80ms vs 4+ seconds!

### Testing & Quality

```bash
npm run lint              # Lint all apps (parallel)
npm run test              # Run all tests
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
VITE_CREATOR_URL=http://localhost:8083
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
