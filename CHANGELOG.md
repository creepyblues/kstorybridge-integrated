# KStoryBridge Monorepo - Changelog

This document tracks major architectural changes, system improvements, and historical context for the KStoryBridge monorepo.

For current implementation details, see [CLAUDE.md](CLAUDE.md) and app-specific documentation.

---

## 2025-11

### Migration Safety Protocol Implementation (2025-11-05)
**Context**: Following `title_content_analysis` data loss incident on 2025-11-04

**Changes**:
- Added MANDATORY migration safety rules to prevent data loss
- Created migration templates for safe schema changes and backup-first operations
- Implemented `backup-critical-tables.sh` script for pre-migration backups
- Established approval process for destructive migrations
- Added Migration Safety Guide and Migration Testing Protocol documentation

**Impact**: Prevents future data loss from `DROP TABLE` operations without backups

**Documentation**:
- [Migration Safety Guide](docs/guides/MIGRATION_SAFETY_GUIDE.md)
- [Migration Testing Protocol](docs/guides/MIGRATION_TESTING_PROTOCOL.md)
- Templates: `docs/templates/safe_schema_change_template.sql`, `docs/templates/backup_first_template.sql`

### Turborepo Build System Update (2025-11-08)
**Breaking Change**: Turborepo 2.0 renamed `pipeline` field to `tasks`

**Changes**:
- Updated all turbo.json files to use `tasks` instead of `pipeline`
- Enhanced app-level turbo.json files with proper build configuration
- Fixed workspace detection for selective deployments

**Impact**: Builds fail with `pipeline` field - all turbo.json files must use `tasks`

**Configuration Example**:
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

### Authentication System Simplification (2025-11-04)
**Context**: Reduced auth complexity after three-app architecture stabilized

**Changes**:
- Dashboard app: BUYER auth only (~215 lines removed, 50% complexity reduction)
- Creator app: CREATOR auth only (complete separation)
- Removed shared auth pages between apps
- Each app now handles its own user type independently

**Impact**:
- Cleaner codebase with fewer conditional branches
- Tests: 100% pass rate (99/99 tests passing in dashboard)
- Easier to maintain and debug auth issues per app

**See**: [AUTH_DOCUMENTATION.md](docs/active/AUTH_DOCUMENTATION.md)

### Turborepo Integration (2025-11-02)
**Context**: Adopted Turborepo for monorepo build orchestration and selective deployments

**Changes**:
- Integrated Turborepo for intelligent caching and dependency management
- Implemented turbo-ignore for Vercel selective deployments
- Created `/turbo.json` with root tasks configuration
- Added app-level `turbo.json` files for workspace detection
- Modified Vercel "Ignored Build Step" to use `scripts/vercel-ignore-turbo.sh`

**Impact**:
- ~50x faster builds (4s → 80ms) with intelligent caching
- Automatic dependency graph resolution (packages build before apps)
- Selective deployments: Only changed apps deploy to production
- Parallel execution of independent build tasks

**Performance Gains**:
- First build: ~4+ seconds
- Cached rebuild: ~80ms
- Deployment: Only changed apps (not all 4 apps every time)

**Documentation**:
- [TURBOREPO_VERCEL_SETUP.md](docs/guides/TURBOREPO_VERCEL_SETUP.md)
- [VERCEL_DEPLOYMENT_ARCHITECTURE.md](docs/guides/VERCEL_DEPLOYMENT_ARCHITECTURE.md)

---

## 2025-10

### Creator App V2 Rebuild (2025-10-29)
**Context**: Creator v1 had accumulated technical debt and auth issues

**Changes**:
- Complete rebuild of creator app from scratch (`apps/creator`)
- Implemented clean URLs (`/home`, `/titles` instead of `/creators/*`)
- Fixed OAuth implementation with proper callback handling
- Added comprehensive title management features
- Deployed to production at creator.kstorybridge.com

**Impact**:
- OAuth working perfectly for creators
- Clean separation from dashboard app
- Better UX with simplified routes
- 100% test coverage for critical flows

**See**: [Creator App V2 Rebuild Plan](docs/CREATOR_APP_V2_REBUILD_PLAN.md)

### Three-App Architecture Established (2025-10-29)
**Context**: Separated buyer and creator concerns into dedicated apps

**Changes**:
- Dashboard app: Buyer-focused (AI chatbot, tier system, Stripe)
- Creator app: Creator-focused (content management, title CRUD)
- Website app: Marketing and auth redirects

**Benefits**:
- Clear separation of concerns
- Independent deployments per user type
- Cleaner codebase with fewer conditionals
- Easier to reason about user flows

### AI Chatbot Phase 4: Contextual Response Generation (2025-10-21)
**Status**: Deployed & Active

**Features**:
- Smart follow-up detection (analyzes last 3 messages)
- Focused response generation (section-specific: characters, plot, themes, market)
- Anti-repetition logic (prevents repeating shared information)
- Feature flag: `ENABLE_CONTEXTUAL_RESPONSES=true`

**Impact**:
- 50% token reduction on multi-turn conversations
- 0% repetition rate (down from ~70% on follow-ups)
- 20-30% of queries use focused responses
- Cost: $0.015-0.018/query on follow-ups (down from $0.02)

**See**: [docs/features/chatbot/PHASE_4_CONTEXTUAL_RESPONSES.md](docs/features/chatbot/PHASE_4_CONTEXTUAL_RESPONSES.md)

### AI Chatbot Phase 3: Pitch Analytics Integration (2025-10-21)
**Status**: Deployed

**Features**:
- Database migration: Added `pitch_analysis` JSONB field to vector search results
- Edge function enhancement: Integrated pitch analytics formatting and context
- Feature flag control: `ENABLE_PITCH_CONTEXT`
- 60+ enhanced query types across 9 categories

**Impact**:
- 30-50% of queries use pitch data (when available)
- Enhanced character details with archetypes and relationships
- Story loglines, conflicts, and narrative structure
- Market positioning and comparable titles
- Source material metrics (views, chapters, platform)
- Korean cultural elements analysis
- Quality threshold: Only uses data with processing_confidence >= 0.70

**See**: [docs/features/chatbot/PITCH_ANALYTICS.md](docs/features/chatbot/PITCH_ANALYTICS.md)

### Titles Table Enhancement: Questionnaire Fields (2025-10-24)
**Context**: Added comprehensive story and achievement data collection

**Added Fields**:
- Story Details: `inspiration`, `important_issues`, `setting_description`, `world_lore`, `supernatural_concepts`, `character_details` (jsonb), `story_structure`, `planned_ending`, `narrative_arc`
- Achievements: `awards` (array), `sales_records`, `merchandise_deals`, `print_editions`, `print_edition_details`, `media_coverage`, `celebrity_endorsements`, `creator_achievements` (jsonb)

**New Related Tables**:
- `title_platforms`: Platform-specific metrics (Naver, Kakao, Lezhin, etc.)
- `title_documents`: Document attachments (PDFs, scripts, press releases, etc.)
- `title_drafts`: Multi-step questionnaire draft storage
- `title_content_analysis`: AI-generated content analysis (includes `pitch_analysis`)

**Impact**: Richer title metadata for AI chatbot and buyer discovery

### AI Chatbot Phase 2: Prompt Engineering (2025-10-04)
**Status**: Completed

**Features**:
1. Intent Classification - 5 types (discovery, comparison, information, recommendation, follow-up)
2. Conversation Context Weighting - Recent message prioritization, title mention tracking
3. Fallback Keyword Search - PostgreSQL full-text search when vector fails

**Impact**:
- Intent Accuracy: 100%
- Zero-Results Rate: ~2% (down from ~15%)

### AI Chatbot Phase 1: Quick Wins (2025-10-04)
**Status**: Completed

**Features**:
1. Vector Search Increase (5→10 results) - +100% coverage
2. Anti-Hallucination Validation - <5% false recommendations
3. Fuzzy Title Matching - 80% similarity threshold, +40% link success

**Impact**:
- Search Results: 10 titles with >0.8 similarity scores
- Response Times: 3-5 seconds average
- Hallucination Rate: <5%

**See**: [docs/features/chatbot/PHASE_1_2_SUMMARY.md](docs/features/chatbot/PHASE_1_2_SUMMARY.md)

### OAuth Production Fix (2025-10-03)
**Context**: OAuth signup was hanging/timing out in production

**Issue**: RLS policy checks on `user_buyers`/`user_creators` tables during session creation caused race conditions with profile edge functions

**Solution**:
- Implemented edge function architecture for atomic profile creation
- Applied migration `20250130000000_fix_oauth_rls_timing.sql`
- 100% success rate post-fix

**Impact**: Reliable OAuth signup in production environment

**See**: [AUTH_DOCUMENTATION.md](docs/active/AUTH_DOCUMENTATION.md) - "OAuth signup hangs" section

---

## 2025-08

### Default Tier Change for Buyers (2025-08-21)
**Context**: Changed buyer onboarding strategy

**Change**: Default tier changed from `invited` to `basic`

**Impact**:
- New buyers automatically get `basic` tier (free access)
- `invited` tier reserved for special invitations
- Tier hierarchy: basic(1) < pro(2) < suite(3)

---

## 2025-07

### Database Migrations Centralization (2025-07-15)
**Context**: Multiple apps were creating migrations independently, causing conflicts

**Changes**:
- Established `/supabase/migrations/` as single source of truth
- Deprecated app-specific migration folders (`apps/*/supabase/migrations/`)
- All migrations must be created from root directory
- Added documentation standards for migration files

**Impact**:
- No more conflicting migrations across apps
- Clear audit trail in root folder
- All apps share same database state

**See**: [Migration Documentation Standards](docs/MIGRATION_DOCUMENTATION_STANDARDS.md)

---

## 2025-06

### Account Type Standardization (2025-06-10)
**Context**: Inconsistent terminology across codebase

**Changes**:
- Standardized `ip_owner` → `creator` across all apps
- Updated database tables, auth metadata, and UI references
- Consistent terminology in documentation

**Impact**: Clearer user flows and code consistency

---

## 2025-05

### Vercel Deployment Architecture (2025-05-20)
**Context**: Needed separate staging and production environments with selective deployments

**Architecture Established**:
- 6 Vercel projects for 4 apps (staging + production per app)
- Branch-based deployment configuration via `vercel.json`
- Staging (v2 branch): Manual deployment only
- Production (main branch): Auto-deploy with selective builds

**Two-Level Configuration**:
1. `vercel.json` (`git.deploymentEnabled`) - Controls branch-based auto-deploy
2. Vercel Dashboard ("Production Branch" setting) - Controls which Git branch project monitors

**Common Issue Identified**: Staging projects auto-deploying on main branch merges
- Root Cause: Staging projects had "Production Branch" = `main` instead of `v2`
- Resolution: Update Vercel Dashboard settings for each project

**See**: [VERCEL_DEPLOYMENT_ARCHITECTURE.md](docs/guides/VERCEL_DEPLOYMENT_ARCHITECTURE.md)

---

## Key Learnings & Best Practices

### Migration Safety
- **Always backup before destructive operations** - Use `./scripts/backup-critical-tables.sh`
- **Never use `DROP TABLE` for schema changes** - Use `ALTER TABLE` with data migration
- **Always test in staging first** - Especially for destructive operations
- **Document data impact** - Row counts, affected tables, rollback procedures

### Deployment Strategy
- **Manual staging deploys** - Prevents accidental deploys, allows testing
- **Selective production deploys** - Only changed apps, reduces risk and deploy time
- **Two-level configuration** - Both `vercel.json` and Vercel Dashboard must match

### Authentication Architecture
- **Separate auth per app** - Dashboard for buyers, Creator for creators
- **No OAuth parameters in callback URL** - Use `${window.location.origin}/auth/callback`
- **Edge function for OAuth profile creation** - Prevents RLS race conditions

### Database Patterns
- **Always query by `email`** - Never use non-existent `user_id` field
- **Centralized migrations** - Root `/supabase/migrations/` only
- **Snake_case for database fields** - Prevents form submission failures

### Build System
- **Turborepo for caching** - ~50x faster builds with intelligent caching
- **Dependency graph** - Packages build before apps automatically
- **Parallel execution** - Multiple independent tasks run simultaneously

---

## Archive References

For historical code references:
- `/Users/sungholee/code/kstorybridge-v2/` - Archive of v2 branch state
- `/Users/sungholee/code/kstorybridge-monorepo/` - Archive of main branch state
- Git history: Full audit trail of all changes

---

**Last Updated**: 2025-11-11
