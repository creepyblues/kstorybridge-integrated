# CLAUDE.md - KStoryBridge Monorepo

**Last Updated**: 2025-12-17

> 📜 For historical changes and system evolution, see [CHANGELOG.md](CHANGELOG.md)

## 🔄 Development Workflow (UPDATED 2025-11-02)

**Git Branch Strategy**:
- **`v2` branch**: Staging/development branch (**manual deployment only** - auto-deploy disabled)
- **`main` branch**: Production branch (auto-deploy with selective builds)
- **Branch Protection**: `main` branch requires pull requests (direct pushes blocked)

**Workflow**:
1. Work on `v2` branch for all development
2. **Manually deploy to staging** when ready (see [MANUAL_DEPLOYMENT_GUIDE.md](MANUAL_DEPLOYMENT_GUIDE.md))
3. Test changes in staging environment (dashboard-staging-*.vercel.app, creator-staging.vercel.app)
4. When stable, create pull request from `v2` → `main` for production deployment
5. Get PR approval and merge via GitHub (direct commits to `main` are blocked)
6. Production auto-deploys (only changed apps via turbo-ignore)

**Local Setup**:
```bash
cd /Users/sungholee/code/kstorybridge  # Primary working directory
git checkout v2                         # Default development branch
```

**Creating Pull Request for Production**:
```bash
# Option 1: GitHub CLI (if installed)
gh pr create --base main --head v2 --title "Deploy v2 to production"

# Option 2: GitHub Web UI
# 1. Go to https://github.com/creepyblues/kstorybridge-integrated
# 2. Click "Pull requests" → "New pull request"
# 3. Set base: main, compare: v2
# 4. Review changes, create PR, get approval, and merge
```

**Archive Directories** (for reference only):
- `/Users/sungholee/code/kstorybridge-v2/` - Archive of v2 branch state
- `/Users/sungholee/code/kstorybridge-monorepo/` - Archive of main branch state

## 📁 Documentation Navigation

> 🗂️ **[Master Documentation Index](docs/INDEX.md)** - Complete documentation catalog

### App-Specific Guides
- **[Dashboard App](apps/dashboard/CLAUDE.md)** - Buyer dashboard with tier system, premium content, AI chatbot (v2.0 - clean rebuild, all emails allowed)
- **[Dashboard Legacy](apps/dashboard-legacy/CLAUDE.md)** - 🗄️ ARCHIVED (Nov 2025) - Previous buyer dashboard (reference only)
- **[Creator App](apps/creator/CLAUDE.md)** - Creator-focused dashboard for content management
- **[Website App](apps/website/CLAUDE.md)** - Marketing pages, auth redirects

### System Documentation (`docs/active/`)
- **[AUTH_DOCUMENTATION.md](docs/active/AUTH_DOCUMENTATION.md)** - Complete auth system reference
- **[DATABASE_SCHEMA.md](docs/active/DATABASE_SCHEMA.md)** - Database schema and query patterns
- **[DESIGN_SYSTEM.md](docs/active/DESIGN_SYSTEM.md)** - UI/UX standards, components, color palette
- **[CACHE_POLICY.md](docs/active/CACHE_POLICY.md)** - Session-based caching implementation
- **[LOCAL_VS_PRODUCTION_DIFFERENCES.md](docs/active/LOCAL_VS_PRODUCTION_DIFFERENCES.md)** - Environment comparison
- **[EMAIL_POLICY_DOCUMENTATION.md](docs/active/EMAIL_POLICY_DOCUMENTATION.md)** - Email system guidelines
- **[SECURITY_BEST_PRACTICES.md](docs/active/SECURITY_BEST_PRACTICES.md)** - Credential management
- **[USER_JOURNEY_MAP.md](docs/active/USER_JOURNEY_MAP.md)** - Complete user flows

### Feature Documentation
**AI Chatbot** (`docs/features/chatbot/`):
- **[OVERVIEW.md](docs/features/chatbot/OVERVIEW.md)** - Complete system overview (Phases 1-3)
- **[PHASE_1_2_SUMMARY.md](docs/features/chatbot/PHASE_1_2_SUMMARY.md)** - Phase 1 & 2 test results
- **[PITCH_ANALYTICS.md](docs/features/chatbot/PITCH_ANALYTICS.md)** - Phase 3 integration plan
- **[TESTING_GUIDE.md](docs/features/chatbot/TESTING_GUIDE.md)** - Testing procedures

**Mandate Matcher** (✅ LIVE - 2025-11-22):
- AI-powered title recommendations based on production mandates
- Vector search using OpenAI embeddings (text-embedding-ada-002)
- Cost: ~$0.0015 per search, returns top 15 matches
- Route: `/buyers/mandates`

**Title Intelligence System** (✅ LIVE - 2025-12-01):
- Platform data scraping for Korean webtoon/webnovel platforms
- **Supported Platforms**: Naver Webtoon, Naver Series, Kakao Page, Kakao Webtoon, Manta
- **Edge Function**: `supabase/functions/title-intelligence/` (shared across apps)
- **Database Tables**: `intelligence_titles`, `intelligence_sources`, `intelligence_metrics`, `intelligence_aliases`
- **Creator App**: Full TitleInvestigator tool at `/tools/title-investigator`
- **Dashboard App**: "Collect Data" button in admin TitleEditModal for quick data collection
- **Field Mapping** (Intelligence → Titles):
  | Intelligence | Titles Table |
  |--------------|--------------|
  | views | views |
  | subscribers | likes |
  | rating_score | rating |
  | episode_count | chapters |
  | synopsis_kr | synopsis_kr |
  | genre | genre |
  | author | story_author |
  | thumbnail | title_image |
  | tags | keywords |
- **See**: [apps/creator/CLAUDE.md](apps/creator/CLAUDE.md) for full documentation

**Data Quality Improvement** (🔄 IN PROGRESS - 2025-12-17):
- **[DATA_QUALITY_IMPROVEMENT_TRACKER.md](docs/DATA_QUALITY_IMPROVEMENT_TRACKER.md)** - Systematic data quality tracking
- Phase 1 Complete: Metadata normalization (tone, audience, age_rating, content_format)
- Phase 2 Pending: AI-assisted field completion
- Phase 3 Pending: Rights data entry

**Stripe Payment Integration** (`docs/`):
- **[STRIPE_PAYMENT_INTEGRATION.md](docs/STRIPE_PAYMENT_INTEGRATION.md)** - Complete implementation summary (✅ LIVE - 2025-11-14)
- **[STRIPE_CONFIGURATION_REFERENCE.md](docs/STRIPE_CONFIGURATION_REFERENCE.md)** - Configuration guide and troubleshooting

### Setup Guides (`docs/guides/`)
- **[TURBOREPO_VERCEL_SETUP.md](docs/guides/TURBOREPO_VERCEL_SETUP.md)** - Turborepo + Vercel selective deployment guide
- **[GIT_DEPLOYMENT_STRUCTURE.md](docs/guides/GIT_DEPLOYMENT_STRUCTURE.md)** - Complete Git deployment configuration reference
- **[DEPLOYMENT_STRATEGY.md](docs/guides/DEPLOYMENT_STRATEGY.md)** - Deployment architecture and branch strategy
- **[DEPLOYMENT_INSTRUCTIONS.md](docs/guides/DEPLOYMENT_INSTRUCTIONS.md)** - Vercel deployment procedures
- **[STRIPE_SETUP_GUIDE.md](docs/guides/STRIPE_SETUP_GUIDE.md)** - Stripe integration
- **[OPENAI_PRODUCTION_SETUP.md](docs/guides/OPENAI_PRODUCTION_SETUP.md)** - OpenAI API setup

**Migration Safety** (`docs/guides/`):
- **[MIGRATION_SAFETY_GUIDE.md](docs/guides/MIGRATION_SAFETY_GUIDE.md)** - Safety protocols for destructive operations (MANDATORY - Added 2025-11-05)
- **[MIGRATION_TESTING_PROTOCOL.md](docs/guides/MIGRATION_TESTING_PROTOCOL.md)** - Testing procedures and checklists

---

## 🚀 Quick Start Commands

### Root Level (Turborepo)

**Development**:
```bash
npm run dev               # Start all apps in parallel
npm run dev:dashboard     # http://localhost:8081 (Buyer dashboard only)
npm run dev:creator       # http://localhost:8083 (Creator dashboard only)
npm run dev:website       # http://localhost:5173 (Marketing site only)
```

**Building** (with intelligent caching):
```bash
npm run build             # Build all apps (with dependency graph)
npm run build:dashboard   # Build dashboard only
npm run build:creator     # Build creator only
npm run build:website     # Build website only
npm run build:packages    # Build shared packages only
```

**Other**:
```bash
npm run lint              # Lint all apps
npm run test              # Run tests in all apps
npm install               # Install dependencies
```

**Performance**: Turborepo provides ~50x faster cached builds. Second builds complete in ~80ms vs 4+ seconds.

### Individual Apps (from `apps/{app}/`)
```bash
npm run dev               # Start dev server
npm run build             # Production build
npm run build:dev         # Development build
npm run lint              # Run ESLint
npm run preview           # Preview production build
```

---

## 🏗️ Architecture Overview

### Project Structure
```
├── apps/
│   ├── dashboard/         # Buyer dashboard v2.0 (port 8081) - clean rebuild
│   ├── dashboard-legacy/  # 🗄️ ARCHIVED (Nov 2025) - Previous buyer dashboard
│   ├── creator/           # Creator dashboard (port 8083)
│   └── website/           # Marketing website (port 5173)
├── packages/              # Shared libraries
└── docs/                  # Documentation
```

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui + Radix UI
- **Backend**: Supabase (shared: `dlrnrgcoguxlkkcitlpd`)
- **State**: TanStack Query + React Context
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Build System**: Turborepo (monorepo orchestration, caching, selective deployments)

### Turborepo Build System (ADDED 2025-11-02, UPDATED 2025-11-08)

**What is Turborepo?**
Turborepo is a high-performance build system for JavaScript/TypeScript monorepos. It provides:

- ✅ **Intelligent caching** - ~50x faster builds (4s → 80ms)
- ✅ **Dependency graph** - Builds packages before apps automatically
- ✅ **Parallel execution** - Multiple apps build simultaneously
- ✅ **Selective deployments** - Only build apps that changed (via `turbo-ignore`)
- ✅ **Remote caching** - Share cache across team and CI/CD

**Configuration Files**:
- `/turbo.json` - Root tasks configuration (uses `tasks` field, not deprecated `pipeline`)
- `/apps/{app}/turbo.json` - App-specific build configurations (enable workspace detection)
- `/package.json` - Scripts use `turbo run` commands

**Common Commands**:
```bash
npm run build              # Build all apps with caching
npm run build:creator      # Build specific app
turbo run build --dry-run  # Preview what will build
```

**Vercel Integration** (Production Selective Deployment):
All 6 Vercel projects use an enhanced wrapper script in the "Ignored Build Step" field:

```bash
cd ../.. && bash scripts/vercel-ignore-turbo.sh
```

**Vercel Project Architecture** (6 Projects, 4 Apps):

| Vercel Project | App Directory | Environment | Branch | Auto-Deploy | Domain |
|----------------|---------------|-------------|--------|-------------|---------|
| `dashboard-staging` | apps/dashboard | Staging | v2 | ❌ Manual | dashboard-staging.kstorybridge.com |
| `creator-staging` | apps/creator | Staging | v2 | ❌ Manual | creator-staging.kstorybridge.com |
| `kstorybridge-dashboard` | apps/dashboard | Production | main | ✅ Auto (selective) | dashboard.kstorybridge.com |
| `creator` | apps/creator | Production | main | ✅ Auto (selective) | creator.kstorybridge.com |
| `kstorybridge-website` | apps/website | Production | main | ✅ Auto (selective) | kstorybridge.com |
| `dashboard-next` | apps/dashboard-next | Development | main | ❌ Manual | dashboard-next.kstorybridge.com (TBD) |

**Key Insight**: Each app directory's `vercel.json` controls 1-2 Vercel projects through branch-based deployment configuration.

**How it works**:
- `cd ../..` - Changes from `apps/[app]` to monorepo root
- `scripts/vercel-ignore-turbo.sh` - Enhanced wrapper that auto-detects workspace from package.json
- App-level `turbo.json` files enable workspace detection
- Only builds apps that have changed since last deployment

**Hybrid Deployment Model**:
- **Staging (v2 branch)**: Auto-deploy DISABLED via `vercel.json` - use manual deployment
- **Production (main branch)**: Auto-deploy ENABLED with selective builds via turbo-ignore

**Deployment Configuration**:
- `apps/{app}/vercel.json` - Contains `git.deploymentEnabled: { v2: false, main: true }`
- `/scripts/vercel-ignore-turbo.sh` - Selective deployment script with debugging
- **Vercel Dashboard Settings**: Each project must have correct "Production Branch" setting (v2 for staging, main for production)
- **Complete architecture**: See [VERCEL_DEPLOYMENT_ARCHITECTURE.md](docs/guides/VERCEL_DEPLOYMENT_ARCHITECTURE.md)

**⚠️ CRITICAL - Two-Level Configuration Required**:
For proper deployment behavior, **BOTH** configurations must be correct:
1. **vercel.json** (`git.deploymentEnabled`) - Controls branch-based auto-deploy enablement
2. **Vercel Dashboard** ("Production Branch" setting) - Controls which Git branch the project monitors

**Common Issue**: Staging projects auto-deploy on main branch merges
- **Root Cause**: Staging projects have "Production Branch" = `main` instead of `v2` in Vercel Dashboard
- **Fix**: Go to Vercel Dashboard → Settings → Git → Change "Production Branch" to `v2` for staging projects
- **See**: [Critical Vercel Project Settings Checklist](docs/guides/VERCEL_DEPLOYMENT_ARCHITECTURE.md#critical-vercel-project-settings-checklist)

**⚠️ IMPORTANT - Turborepo 2.0 Breaking Change**:
- Turborepo 2.0 renamed `pipeline` field to `tasks`
- All turbo.json files must use `tasks` (not `pipeline`) or builds will fail
- App-level turbo.json files must include proper build configuration:
  ```json
  {
    "extends": ["//"],
    "tasks": {
      "build": {
        "dependsOn": ["^build"],
        "outputs": ["dist/**"]
      }
    }
  }
  ```

**See**:
- [MANUAL_DEPLOYMENT_GUIDE.md](MANUAL_DEPLOYMENT_GUIDE.md) - Complete deployment workflow
- [VERCEL_DEPLOYMENT_ARCHITECTURE.md](docs/guides/VERCEL_DEPLOYMENT_ARCHITECTURE.md) - Complete Vercel architecture reference
- [TURBOREPO_VERCEL_SETUP.md](docs/guides/TURBOREPO_VERCEL_SETUP.md) - Turborepo setup reference (legacy)

#### Deployment Architecture FAQ

**Q: Why are my staging projects auto-deploying when I merge to main?**
A: This is a **Vercel Dashboard configuration issue**. Your staging projects likely have "Production Branch" = `main` instead of `v2`. Fix: Go to Vercel Dashboard → Settings → Git → Change "Production Branch" to `v2` for both staging projects. See [Critical Settings Checklist](docs/guides/VERCEL_DEPLOYMENT_ARCHITECTURE.md#critical-vercel-project-settings-checklist).

**Q: Why 6 Vercel projects for 4 apps?**
A: Each production app has TWO Vercel projects: one for staging (v2 branch), one for production (main branch).

**Q: How does one vercel.json file control two Vercel projects?**
A: The `git.deploymentEnabled` object has branch-name keys. Each Vercel project has a "Production Branch" setting in Vercel Dashboard that determines which Git branch it monitors. When that branch receives a push, Vercel reads the corresponding key from `vercel.json`. **Both configurations must be correct**.

**Q: What happens if I push to v2 branch?**
A: NONE of the projects auto-deploy (all have `"v2": false`). You must manually deploy using `vercel` CLI.

**Q: What happens if I merge to main branch?**
A: Only apps that changed will auto-deploy:
- ✅ `kstorybridge-dashboard` (if dashboard app changed)
- ✅ `creator` (if creator app changed)
- ✅ `kstorybridge-website` (if website app changed)
- ❌ Staging projects remain unchanged (auto-deploy disabled)

**Q: Can I have different vercel.json settings for staging vs production?**
A: No. Both projects read the SAME file. Use branch-based keys in `git.deploymentEnabled` to differentiate behavior.

**See**: [VERCEL_DEPLOYMENT_ARCHITECTURE.md](docs/guides/VERCEL_DEPLOYMENT_ARCHITECTURE.md) for complete FAQ

### Database & Backend
- Single Supabase project shared across all apps
- Auto-generated types: `src/integrations/supabase/types.ts`
- **CRITICAL**: Query by `email`, never by `user_id` (field doesn't exist)

### Database Migrations (UPDATED 2025-11-05)
- **✅ Single source of truth**: `/supabase/migrations/` (root level only)
- **❌ App-specific folders DEPRECATED**: `apps/*/supabase/migrations/` are for historical reference only
- **Creating migrations**: Always run from root:
  ```bash
  cd /Users/sungholee/code/kstorybridge
  npx supabase migration new [migration_name]
  ```
- **Why root only**: All apps share the same Supabase database, so migrations must be centralized

**⚠️ CRITICAL - Migration Safety (Added 2025-11-05)**:
- **ALWAYS use templates** from `docs/templates/` for schema changes or destructive operations
- **ALWAYS create backup** before destructive operations: `./scripts/backup-critical-tables.sh [table_name]`
- **ALWAYS test in staging** with production-like data before production deployment
- **NEVER use `DROP TABLE`** for schema changes (use safe migration pattern instead)
- See [Migration Safety Guide](docs/guides/MIGRATION_SAFETY_GUIDE.md) for complete requirements

### Three-App Architecture (UPDATED 2025-10-29)

**Separate Apps for Different User Types**:

| App | Port | Production URL | Staging URL | Purpose | Status |
|-----|------|----------------|-------------|---------|--------|
| **Dashboard** | 8081 | dashboard.kstorybridge.com | dashboard-v2.kstorybridge.com | Buyer-focused features (AI chatbot, tier system) | ✅ Live |
| **Creator** | 8083 | creator.kstorybridge.com | creator-staging.kstorybridge.com | Creator-focused features (content management) | ✅ Live |
| **Website** | 5173 | kstorybridge.com | - | Marketing site, auth redirects | ✅ Live |

**Key Differences**:
- **Dashboard**: Buyer routes (`/buyers/*`), AI chatbot, tier-gated content, Stripe integration
- **Creator**: Clean URLs (`/home`, `/titles`), content management, title CRUD, profile management, OAuth working perfectly
- **Website**: Marketing pages, redirects to dashboard OR creator for authentication

**Authentication Routing**:
- Buyers sign up → Dashboard app (`/buyers/home`)
- Creators sign up → Creator app (`/home`) ✅ **LIVE**

**See**: [Creator App V2 Rebuild Plan](docs/CREATOR_APP_V2_REBUILD_PLAN.md) for complete deployment history

---

## 🔐 Authentication Flow

### Current User Flow
1. Users visit **Website** (`kstorybridge.com`) for marketing
2. Website redirects based on account type:
   - **Buyers** → **Dashboard** app for authentication
   - **Creators** → **Creator** app for authentication
3. After auth:
   - **Buyers**: Dashboard app `/buyers/chat`
   - **Creators**: Creator app `/home`

### Account Types
- **buyer** - Media buyers with tier system (basic/pro/suite)
- **creator** - Content creators

**See**:
- [AUTH_DOCUMENTATION.md](AUTH_DOCUMENTATION.md) - Complete auth system reference
- [apps/dashboard/CLAUDE.md](apps/dashboard/CLAUDE.md) - Buyer auth implementation
- [apps/creator/CLAUDE.md](apps/creator/CLAUDE.md) - Creator auth implementation
- [CHANGELOG.md](CHANGELOG.md) - Auth system evolution history

---

## 🚨 Critical Rules

### Security
- ❌ **NEVER commit**: `.env` files, API keys, service role keys, `secrets/` directories
- ✅ **Use**: Vercel dashboard for env vars, Supabase CLI for edge function secrets
- ✅ **Rotate immediately** if credentials exposed
- **See**: [SECURITY_BEST_PRACTICES.md](SECURITY_BEST_PRACTICES.md)

### Database
- ✅ **Query pattern**: `.eq('email', user.email)` (always use `email`)
- ❌ **Never use**: `user_id` field (doesn't exist in user tables)
- ✅ **Migration workflow**: Create in `/supabase/migrations/` (root only), never loose SQL files
- ❌ **Never use**: `apps/*/supabase/migrations/` (deprecated, historical reference only)
- **See**: [docs/active/DATABASE_SCHEMA.md](docs/active/DATABASE_SCHEMA.md)

### Migration Safety (ADDED 2025-11-05)
**Following `title_content_analysis` data loss incident (2025-11-04), these rules are MANDATORY:**

- ❌ **NEVER use `DROP TABLE`** for schema changes (use `ALTER TABLE` with data migration)
- ❌ **NEVER run destructive migrations** without creating backup first
- ❌ **NEVER skip staging tests** for destructive operations (DROP, TRUNCATE, ALTER TYPE)
- ✅ **ALWAYS use migration templates** from `docs/templates/` for safety
- ✅ **ALWAYS create backup** before destructive operations: `./scripts/backup-critical-tables.sh [table_name]`
- ✅ **ALWAYS test in staging** with production-like data before production deployment
- ✅ **ALWAYS document** data impact (row counts, affected tables) in migration header
- ✅ **ALWAYS get approval** from database admin and lead developer for destructive migrations
- ✅ **ALWAYS use clear naming** for destructive migrations (include DESTRUCTIVE or DROP in filename)
- ✅ **ALWAYS document rollback** procedure in migration file

**Templates**:
- Safe schema change: `docs/templates/safe_schema_change_template.sql`
- Backup-first destructive: `docs/templates/backup_first_template.sql`

**See**:
- [Migration Safety Guide](docs/guides/MIGRATION_SAFETY_GUIDE.md) - Complete safety protocols
- [Migration Testing Protocol](docs/guides/MIGRATION_TESTING_PROTOCOL.md) - Testing procedures
- [Migration Documentation Standards](docs/MIGRATION_DOCUMENTATION_STANDARDS.md) - Documentation requirements

### Authentication
- ✅ **OAuth callbacks**: No URL parameters, use `${window.location.origin}/auth/callback`
- ✅ **Account type**: Set during signup in metadata, never default assignment
- ✅ **Session-based only**: No cross-session data persistence
- **See**: [AUTH_DOCUMENTATION.md](AUTH_DOCUMENTATION.md)

### Email System
- ✅ **Always use**: `EmailService.getInstance().sendWelcomeEmail()`
- ❌ **Never**: Direct edge function calls or localStorage tracking
- ✅ **Database deduplication**: Automatic via `email_logs` table
- **See**: [EMAIL_POLICY_DOCUMENTATION.md](EMAIL_POLICY_DOCUMENTATION.md)

### Design System
- ❌ **NEVER**: Yellow colors (`bg-yellow-*`, yellow hex values)
- ✅ **Cards**: `bg-transparent border-gray-300 shadow-none rounded-2xl`
- ✅ **Buttons**: `variant="outline" border-gray-300 hover:bg-gray-100`
- ✅ **Font**: SF Pro (automatic, no class needed)
- **See**: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)

### Localhost Development
- ✅ **All redirects**: Stay in localhost, never redirect to production
- ✅ **OAuth testing**: Use localhost callback URLs in development

---

## 🎯 App-Specific Features

### AI Chatbot (Dashboard Only)
Dashboard includes an AI-powered chatbot for title discovery with vector search, pitch analytics integration, and contextual response generation. See [apps/dashboard/CLAUDE.md](apps/dashboard/CLAUDE.md) and [docs/features/chatbot/](docs/features/chatbot/) for complete documentation.

### Content Management (Creator Only)
Creator app provides comprehensive title management with multi-step questionnaire, document uploads, and platform metrics. See [apps/creator/CLAUDE.md](apps/creator/CLAUDE.md) for complete documentation.

---

## 📊 Common Development Patterns

### Database Operations

**Supabase Config**:
```typescript
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Query Patterns**:
```typescript
// ✅ CORRECT
.eq('email', user.email?.toLowerCase())

// ❌ INCORRECT
.eq('user_id', user.id)
```

### User Tables Structure

**user_buyers** (query by `email`):
- `tier`: basic (default) | invited | pro | suite
- Tier hierarchy: basic(1) < pro(2) < suite(3)
- **See**: [apps/dashboard/CLAUDE.md](apps/dashboard/CLAUDE.md) for tier system implementation

**user_creators** (query by `email`):
- `pen_name`: Always use this field (not `pen_name_or_studio`)
- `ip_owner_role`: REQUIRED (author | agent)
- `invitation_status`: invited (default) | active | pending

### Dashboard-Specific Patterns
- **Tier System**: See [apps/dashboard/CLAUDE.md](apps/dashboard/CLAUDE.md)
- **Cache System**: See [apps/dashboard/CLAUDE.md](apps/dashboard/CLAUDE.md) and [CACHE_POLICY.md](CACHE_POLICY.md)

---

## 🎨 Design Standards Quick Reference

### Colors
- **Primary Text**: `text-black`
- **Neutrals**: `gray-50`, `gray-100`, `gray-200`, `gray-300`, `gray-500`, `gray-900`
- **Status**: `red-*` (error), `green-*` (success), `blue-*` (info)
- **Links**: `text-black hover:text-gray-700`
- ❌ **NEVER**: Yellow colors

### Standard Components
```tsx
// Card
<Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6 sm:mb-8 lg:mb-12">
  <CardContent className="p-4 sm:p-6">...</CardContent>
</Card>

// Button
<Button variant="outline" className="border-gray-300 hover:bg-gray-100">
  Button Text
</Button>

// Badge
<span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
  BETA
</span>
```

**Reference**: `/buyers/profile` page for visual standard
**See**: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for complete guidelines

---

## 🧪 Development Workflow

### Local Testing
```bash
# Standard setup
npm install
npm run dev:dashboard
npm run dev:website

# Cross-domain testing (.env.local)
VITE_DASHBOARD_URL=http://localhost:8081
VITE_WEBSITE_URL=http://localhost:5173
```

### Build Verification
```bash
npm run build:all        # Build all apps
npm run lint:all         # Lint check
```

### Database Migrations
```bash
# ALWAYS run from root directory
cd /Users/sungholee/code/kstorybridge
npx supabase migration new [name]
npx supabase db reset    # Test locally first
npx supabase db push     # Apply to production
```

**Important**: Never create migrations in `apps/*/supabase/migrations/` - these folders are deprecated.

---

## 📋 Data Consistency Guidelines

### User Signup Data Flow

**Field Naming - Always use snake_case matching database**:
```typescript
// ✅ CORRECT - Buyer fields
interface BuyerFormData {
  full_name: string;        // NOT fullName
  buyer_company: string;    // NOT buyerCompany
  buyer_role: string;       // NOT buyerRole
  linkedin_url?: string;    // NOT linkedinUrl
  tier?: 'basic' | 'pro' | 'suite';
  requested?: boolean;      // Required DB field
}

// ✅ CORRECT - Creator fields
interface CreatorFormData {
  full_name: string;           // NOT fullName
  pen_name: string;            // NOT penNameOrStudio
  ip_owner_role: string;       // NOT ipOwnerRole (REQUIRED)
  ip_owner_company?: string;   // NOT ipOwnerCompany
  website_url?: string;        // NOT websiteUrl
  invitation_status?: string;
}
```

**Critical**: Use database field names (snake_case) in forms, auth metadata, and profile creation to prevent form submission failures.

---

## 🔧 Common Issues & Solutions

### OAuth Production (UPDATED 2025-10-03)
**Issue**: OAuth signup hangs/times out in production
**Solution**: Edge function architecture (100% success rate)
**Migration Required**: Apply `20250130000000_fix_oauth_rls_timing.sql`
**See**: [AUTH_DOCUMENTATION.md](AUTH_DOCUMENTATION.md) - "OAuth signup hangs" section

### Database Connectivity
**Pattern**: Show errors to users, never use mock data fallback
**See**: [CACHE_POLICY.md](CACHE_POLICY.md) - Error handling section

### Migration Safety
- ❌ **Never**: Edit existing migration files
- ✅ **Always**: Create new migration for changes
- ✅ **Document**: Status (IN_PROGRESS | COMPLETED | DEPRECATED)
- **See**: `/docs/MIGRATION_DOCUMENTATION_STANDARDS.md`

---

## 📚 Content Management (Titles Table)

### Key Fields (Quick Reference)
- `title_id`, `title_name_kr`, `title_name_en` - Title identification
- `synopsis`, `synopsis_kr`, `description` - Story summaries
- `story_author`, `art_author` - Creator credits
- `genre` (array), `content_format`, `tone` - Content classification
- `rights`, `rights_holder_name` - Business & rights
- `views`, `rating`, `chapters` - Metrics
- `title_image`, `title_url` - Media
- `created_at`, `updated_at` - System fields
- Vector embeddings (1536-dim) - AI search

### Related Tables
- `title_platforms` - Platform-specific metrics
- `title_documents` - Document attachments
- `title_drafts` - Multi-step questionnaire drafts
- `title_content_analysis` - AI-generated analysis

**See**:
- [apps/creator/CLAUDE.md](apps/creator/CLAUDE.md) - Complete field list and creator workflow
- [docs/active/DATABASE_SCHEMA.md](docs/active/DATABASE_SCHEMA.md) - Complete schema reference

---

## 🎯 Important Notes

- **Auto-generated types**: Don't edit `integrations/supabase/types.ts` manually
- **UI components**: shadcn/ui in `components/ui/` are generated, avoid direct edits
- **Shared Supabase**: All apps use same project, separate migration folders
- **Data completeness**: When showing "all data", include ALL available fields
- **Testing**: Always test with small datasets first, use dry-run modes
- **Build verification**: Run `npm run build:all` after significant changes
- **Documentation updates**: Update docs when changing DB schema, auth flow, account types, or policies

---

## 🔗 Quick Links

### Development
- Dashboard: http://localhost:8081
- Dashboard Next: http://localhost:8085
- Creator: http://localhost:8083
- Website: http://localhost:5173
- Supabase: https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd

### Staging
- Dashboard: https://dashboard-v2.kstorybridge.com
- Creator: https://creator-staging.kstorybridge.com

### Production
- Dashboard: https://dashboard.kstorybridge.com
- Creator: https://creator.kstorybridge.com (✅ Live - October 2025)
- Website: https://kstorybridge.com

### Documentation
All comprehensive documentation is in root-level `.md` files. This file provides quick reference only - refer to specific documentation files for detailed implementation guidance.
- never use parameters in oauth callback URL 
- never ever use parameter in oauth callback URL!!!