# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development (from repo root)
npm run dev               # Start all apps in parallel
npm run dev:dashboard     # http://localhost:8081 (Buyer dashboard)
npm run dev:creator       # http://localhost:8083 (Creator dashboard)
npm run dev:website       # http://localhost:5173 (Marketing site)

# Building (Turborepo with intelligent caching, ~50x faster on cache hits)
npm run build             # Build all apps
npm run build:dashboard   # Build dashboard only
npm run build:creator     # Build creator only
npm run build:website     # Build website only

# Linting & Testing
npm run lint              # Lint all apps
npm run test              # Run Vitest unit tests in all apps

# Testing - E2E (Playwright)
npm run test:e2e          # Run all Playwright E2E tests
npm run test:e2e:ui       # Playwright UI mode (interactive)
npm run test:e2e:debug    # Debug mode with headed browser
npm run test:e2e:staging  # Test against staging environment

# Testing - Individual (from app directory)
cd apps/dashboard && npx vitest run src/services/titlesService.test.ts  # Single test file
cd apps/dashboard && npx vitest --watch src/services/                    # Watch mode on directory
cd apps/dashboard && npx playwright test e2e/auth.e2e.ts                # Single E2E test

# Database Migrations (ALWAYS from repo root)
npx supabase migration new [migration_name]
npx supabase db reset     # Test locally
npx supabase db push      # Apply to production

# Edge Function Deployment
npx supabase functions deploy [function-name]
```

## Architecture Overview

### Monorepo Structure

```
kstorybridge-integrated/
├── apps/
│   ├── dashboard/            # Buyer dashboard v2.0 (port 8081)
│   ├── creator/              # Creator dashboard (port 8083)
│   ├── website/              # Marketing site (port 5173)
│   └── dashboard-legacy/     # ARCHIVED - reference only
├── packages/
│   ├── tools/                # AI tools: Comps Generator, Format Fit, OMDB (@kstorybridge/tools)
│   ├── auth/                 # Auth utilities & validation
│   ├── ui/                   # shadcn/ui component library
│   ├── api-client/           # Supabase/API wrapper
│   ├── design-system/        # Design tokens & themes
│   ├── colors/               # Color palette constants
│   ├── utils/                # Common utilities
│   ├── title-intelligence/   # Title scraping & data tools
│   ├── build-config/         # Shared build configurations
│   ├── testing/              # Test utilities
│   └── storybook/            # Component documentation
├── supabase/
│   ├── migrations/           # Database migrations (ONLY place for migrations)
│   └── functions/            # 27 edge functions (shared across apps)
├── scripts/                  # Utility scripts (deployment, data, testing)
├── docs/                     # Documentation (see Navigation section below)
└── turbo.json                # Turborepo config (uses `tasks`, NOT deprecated `pipeline`)
```

### Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI)
- **Backend**: Supabase (single shared project: `dlrnrgcoguxlkkcitlpd`)
- **State**: TanStack Query + React Context
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Build**: Turborepo 2.0 (uses `tasks` field in turbo.json, NOT `pipeline`)
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Payments**: Stripe (both apps)
- **AI**: OpenAI (embeddings, chatbot, comps generation)

### Three-App Architecture

| App | Port | Users | Key Features |
|-----|------|-------|--------------|
| **Dashboard** | 8081 | Buyers | AI chatbot, tier-gated content, Stripe, routes under `/buyers/*` |
| **Creator** | 8083 | Creators | Title management, multi-step questionnaire, Stripe billing, clean URLs (`/home`, `/titles`) |
| **Website** | 5173 | All | Marketing pages, redirects buyers→dashboard, creators→creator app |

### Internal App Structure (common pattern)

```
apps/{app}/src/
├── App.tsx                   # Main router
├── components/               # Feature-organized components + ui/ (shadcn, don't edit directly)
├── contexts/                 # React context providers
├── hooks/                    # Custom hooks (useAuth, etc.)
├── lib/
│   ├── supabase.ts          # Supabase client init
│   └── auth.ts              # Auth logic (signup, signin, OAuth)
├── pages/                    # Route page components
├── services/                 # Business logic & API calls
├── utils/                    # Helpers, analytics
├── integrations/supabase/types.ts  # Auto-generated DB types (don't edit)
└── e2e/                      # Playwright E2E tests (.e2e.ts)
```

### Authentication Flow

1. Users visit **Website** → redirected by account type
2. **Buyers** → Dashboard app → sign up/in → `/buyers/chat`
3. **Creators** → Creator app → sign up/in → `/home`
4. Account types: `buyer` (tier: basic/pro/suite) and `creator`
5. OAuth callbacks: `${window.location.origin}/auth/callback` (NEVER add URL parameters)

### Edge Functions (`supabase/functions/`)

- **Profile**: `create-buyer-profile/`, `create-creator-profile/`, `create-oauth-profile/`
- **Payments**: `create-checkout-session/`, `create-creator-checkout/`, `stripe-webhook/`, `creator-stripe-webhook/`, `get-creator-billing-history/`, `create-billing-portal/`
- **AI/Search**: `chat-orchestrator/`, `comp-navigator/`, `comps-generator/`, `vector-search/`, `format-fit-engine/`, `title-intelligence/`
- **Email/Notifications**: `send-email/`, `send-approval-email/`, `send-analytics-report/`, `slack-webhook-proxy/`, `notify-title-decision/`
- **Content/Admin**: `generate-asset/`, `key-visuals-collector/`, `extract-pitch-test/`, `regenerate-embeddings/`, `approve-title/`, `trial-activity/`, `funnel-report-cron/`
- **Reporting**: `funnel-report-cron/` (Mon 6am PT operating scorecard), `weekly-activity-digest/` (Sun 6am PT: named signups/returns + top pages, via `send-analytics-report`). Per-user page dwell logged to `page_view_events` by dashboard `PageViewLogger`.
- **Shared**: `_shared/` (reusable utilities)

### Deployment

- **`v2` branch**: Staging (manual deploy only, auto-deploy disabled)
- **`main` branch**: Production (auto-deploy with selective builds via turbo-ignore)
- **Branch protection**: `main` requires PRs, direct pushes blocked
- All development happens on `v2`, then PR to `main` for production
- 6 Vercel projects for 3 apps (staging + production each)
- See [VERCEL_DEPLOYMENT_ARCHITECTURE.md](docs/guides/VERCEL_DEPLOYMENT_ARCHITECTURE.md) for full details

## Critical Rules

### Database

- **Query user tables by `email`**: `.eq('email', user.email?.toLowerCase())` - NEVER by `user_id` (field doesn't exist)
- **Query titles by `creator_id`**: `.eq('creator_id', user.id)` (UUID from auth)
- **Field naming**: Always snake_case matching database columns (e.g., `full_name` not `fullName`, `buyer_company` not `buyerCompany`)
- **Migrations**: Only in `/supabase/migrations/` (root). `apps/*/supabase/migrations/` are deprecated
- **Auto-generated types**: Never edit `integrations/supabase/types.ts` manually

### Migration Safety (mandatory after 2025-11-04 data loss incident)

- NEVER use `DROP TABLE` for schema changes (use `ALTER TABLE` with data migration)
- NEVER run destructive migrations without backup: `./scripts/backup-critical-tables.sh [table_name]`
- ALWAYS use templates from `docs/templates/` for schema changes
- ALWAYS test destructive operations in staging first
- Never edit existing migration files; create new ones instead
- **Remote migration history drifts from the files** (several were applied by hand or never applied).
  NEVER run a plain `npx supabase db push`. Apply a single file with
  `npx supabase db query --linked -f supabase/migrations/<file>.sql`, verify in `pg_catalog`, then
  `npx supabase migration repair --status applied <version>`. Check the live catalog before
  assuming a file's objects exist. As of 2026-09-05 the remote history is fully reconciled
  (every local file is recorded and verified present). Snapshot first:
  `node scripts/backup-critical-tables.mjs <tables>`
- See [Migration Safety Guide](docs/guides/MIGRATION_SAFETY_GUIDE.md)

### Authentication

- OAuth callback URL: `${window.location.origin}/auth/callback` - NEVER add parameters
- Account type set during signup in metadata, never default assignment
- Session-based only, no cross-session data persistence
- Localhost redirects must stay in localhost, never redirect to production

### Design System

- NEVER use yellow colors (`bg-yellow-*`, yellow hex values)
- Cards: `bg-transparent border-gray-300 shadow-none rounded-2xl`
- Buttons: `variant="outline" border-gray-300 hover:bg-gray-100`
- Primary text: `text-black`, links: `text-black hover:text-gray-700`
- Font: SF Pro (automatic)
- Reference page: `/buyers/profile`
- See [DESIGN_SYSTEM.md](docs/active/DESIGN_SYSTEM.md)

### Email

- Always use `EmailService.getInstance().sendWelcomeEmail()` - never direct edge function calls
- Database deduplication via `email_logs` table

## Key Database Tables

**user_buyers** (query by `email`):
- `tier`: basic | invited | pro | suite (hierarchy: basic < pro < suite)

**user_creators** (query by `email`):
- `pen_name` (NOT `pen_name_or_studio`), `ip_owner_role` (REQUIRED: author | agent)
- `invitation_status`: invited | active | pending

**titles** (query by `creator_id` for ownership, `title_id` for lookup):
- `title_name_kr`, `title_name_en`, `synopsis`, `synopsis_kr`
- `genre` (array), `content_format`, `tone`, `audience`, `age_rating`
- `story_author`, `art_author`, `rights`, `rights_holder_name`
- `views`, `rating`, `chapters`, `title_image`, `title_url`
- Vector embeddings (1536-dim) for AI search

**Related**: `title_platforms`, `title_documents`, `title_drafts`, `title_content_analysis`

## Documentation Navigation

- **[Dashboard App](apps/dashboard/CLAUDE.md)** - Buyer dashboard: tier system, AI chatbot, Stripe
- **[Creator App](apps/creator/CLAUDE.md)** - Creator dashboard: title management, billing
- **[Website App](apps/website/CLAUDE.md)** - Marketing site, auth redirects
- **[AUTH_DOCUMENTATION.md](docs/active/AUTH_DOCUMENTATION.md)** - Complete auth reference
- **[DATABASE_SCHEMA.md](docs/active/DATABASE_SCHEMA.md)** - Full schema & query patterns
- **[DESIGN_SYSTEM.md](docs/active/DESIGN_SYSTEM.md)** - UI/UX standards
- **[CACHE_POLICY.md](docs/active/CACHE_POLICY.md)** - Session-based caching
- **[Migration Safety Guide](docs/guides/MIGRATION_SAFETY_GUIDE.md)** - Mandatory safety protocols
- **[VERCEL_DEPLOYMENT_ARCHITECTURE.md](docs/guides/VERCEL_DEPLOYMENT_ARCHITECTURE.md)** - Deployment setup
- **[STRIPE_PAYMENT_INTEGRATION.md](docs/STRIPE_PAYMENT_INTEGRATION.md)** - Payment system
- **[Master Documentation Index](docs/INDEX.md)** - Complete catalog

## Environment Configuration

All apps share one Supabase project. Each app needs `.env.local` with:
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (required)
- `VITE_DASHBOARD_URL` / `VITE_CREATOR_URL` / `VITE_WEBSITE_URL` (for cross-app redirects)
- `VITE_STRIPE_PUBLISHABLE_KEY` (dashboard & creator)
- Edge function secrets managed via `npx supabase secrets set`

## URLs

| | Development | Staging | Production |
|---|---|---|---|
| Dashboard | localhost:8081 | dashboard-staging.kstorybridge.com | dashboard.kstorybridge.com |
| Creator | localhost:8083 | creator-staging.kstorybridge.com | creator.kstorybridge.com |
| Website | localhost:5173 | - | kstorybridge.com |
| Supabase | - | - | app.supabase.com/project/dlrnrgcoguxlkkcitlpd |

## Test Account (Automated QA)

For browser-based QA testing that requires authentication, use the `/test-account` skill which provides a suite-tier buyer account. This account should be used by all automated testing (QA, browse, design-review, E2E) that needs sign-in.
