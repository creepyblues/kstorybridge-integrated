# CLAUDE.md - KStoryBridge Monorepo

**Last Updated**: 2025-10-29

## 🔄 Development Workflow (UPDATED 2025-10-21)

**Git Branch Strategy**:
- **`v2` branch**: Staging/development branch (deploy to staging environment)
- **`main` branch**: Production branch (deploy to production only when stable)

**Workflow**:
1. Work on `v2` branch for all development
2. Test changes in staging environment (dashboard-staging-*.vercel.app)
3. When stable, merge `v2` → `main` for production deployment
4. Never commit directly to `main` (except for hotfixes)

**Local Setup**:
```bash
cd /Users/sungholee/code/kstorybridge  # Primary working directory
git checkout v2                         # Default development branch
```

**Archive Directories** (for reference only):
- `/Users/sungholee/code/kstorybridge-v2/` - Archive of v2 branch state
- `/Users/sungholee/code/kstorybridge-monorepo/` - Archive of main branch state

## 📁 Documentation Navigation

> 🗂️ **[Master Documentation Index](docs/INDEX.md)** - Complete documentation catalog

### App-Specific Guides
- **[Dashboard App](apps/dashboard/CLAUDE.md)** - Buyer dashboard with tier system, premium content, AI chatbot (also serves auth pages for buyers and creators temporarily)
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

### Setup Guides (`docs/guides/`)
- **[GIT_DEPLOYMENT_STRUCTURE.md](docs/guides/GIT_DEPLOYMENT_STRUCTURE.md)** - Complete Git deployment configuration reference
- **[DEPLOYMENT_STRATEGY.md](docs/guides/DEPLOYMENT_STRATEGY.md)** - Deployment architecture and branch strategy
- **[DEPLOYMENT_INSTRUCTIONS.md](docs/guides/DEPLOYMENT_INSTRUCTIONS.md)** - Vercel deployment procedures
- **[STRIPE_SETUP_GUIDE.md](docs/guides/STRIPE_SETUP_GUIDE.md)** - Stripe integration
- **[OPENAI_PRODUCTION_SETUP.md](docs/guides/OPENAI_PRODUCTION_SETUP.md)** - OpenAI API setup

---

## 🚀 Quick Start Commands

### Root Level
```bash
npm run dev:dashboard     # http://localhost:8081 (Buyer dashboard)
npm run dev:creator       # http://localhost:8083 (Creator dashboard)
npm run dev:website       # http://localhost:5173 (Marketing site)
npm run build:all         # Build all apps
npm run lint:all          # Lint all apps
npm install               # Install dependencies
```

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
│   ├── dashboard/     # Buyer dashboard (port 8081)
│   ├── creator-v2/    # Creator dashboard (port 8083)
│   ├── creator-v1/    # 🗄️ ARCHIVED (Oct 2025) - Legacy creator app (reference only)
│   └── website/       # Marketing website (port 5173)
├── packages/          # Shared libraries
└── docs/              # Documentation
```

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui + Radix UI
- **Backend**: Supabase (shared: `dlrnrgcoguxlkkcitlpd`)
- **State**: TanStack Query + React Context
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod

### Database & Backend
- Single Supabase project shared across all apps
- Auto-generated types: `src/integrations/supabase/types.ts`
- **CRITICAL**: Query by `email`, never by `user_id` (field doesn't exist)

### Database Migrations (UPDATED 2025-10-25)
- **✅ Single source of truth**: `/supabase/migrations/` (root level only)
- **❌ App-specific folders DEPRECATED**: `apps/*/supabase/migrations/` are for historical reference only
- **Creating migrations**: Always run from root:
  ```bash
  cd /Users/sungholee/code/kstorybridge
  npx supabase migration new [migration_name]
  ```
- **Why root only**: All apps share the same Supabase database, so migrations must be centralized

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

## 🔐 Authentication Flow (UPDATED 2025-10-22)

### Current User Flow
1. Users visit **Website** (`kstorybridge.com`) for marketing
2. Website redirects to **Dashboard** for auth:
   - `/signup/buyer` - Buyer signup
   - `/signup/creator` - Creator signup (formerly IP Owner)
   - `/signin` - Universal signin
   - `/auth/callback` - OAuth callback (no parameters in URL)
3. After auth:
   - **Buyers**: Route to dashboard `/buyers/home` (redirects to `/buyers/chat`)
   - **Creators**: Route to dashboard `/creators/home` (⚠️ will change to creator app `/home`)

### Planned User Flow (After Creator V2 Deployment)
1. Users visit **Website** for marketing
2. Website redirects based on account type:
   - Buyers → **Dashboard** app authentication
   - Creators → **Creator V2** app authentication
3. After auth:
   - **Buyers**: Dashboard app `/buyers/home`
   - **Creators**: Creator V2 app `/home` (clean URLs)

### V2 Status
- ✅ Auth system complete (email + OAuth, no race conditions)
- ✅ Title management complete (CRUD operations)
- ✅ Profile management complete
- 🚧 Testing & deployment (Phase 5 pending)

### Account Types
- **buyer** - Media buyers with tier system (basic/pro/suite)
- **creator** - Content creators (standardized from 'ip_owner')

**See**: [AUTH_DOCUMENTATION.md](AUTH_DOCUMENTATION.md) for complete details

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

## 🤖 AI Chatbot System (UPDATED 2025-10-21)

**Status**: ✅ Phases 1-4 Complete (Contextual Response Generation ACTIVE)

### Deployed Improvements

**Phase 1: Quick Wins** (Completed 2025-10-04)
1. ✅ **Vector Search Increase** (5→10 results) - +100% coverage
2. ✅ **Anti-Hallucination Validation** - <5% false recommendations
3. ✅ **Fuzzy Title Matching** - 80% similarity threshold, +40% link success

**Phase 2: Prompt Engineering** (Completed 2025-10-04)
4. ✅ **Intent Classification** - 5 types (discovery, comparison, information, recommendation, follow-up)
5. ✅ **Conversation Context Weighting** - Recent message prioritization, title mention tracking
6. ✅ **Fallback Keyword Search** - PostgreSQL full-text search when vector fails

**Phase 3: Pitch Analytics Integration** (Deployed 2025-10-21)
7. ✅ **Database Migration** - Added `pitch_analysis` JSONB field to vector search results
8. ✅ **Edge Function Enhancement** - Integrated pitch analytics formatting and context
9. ✅ **Feature Flag Control** - `ENABLE_PITCH_CONTEXT` for gradual rollout

**Phase 4: Contextual Response Generation** (Deployed & Active 2025-10-21)
10. ✅ **Smart Follow-up Detection** - Analyzes last 3 messages for title mentions
11. ✅ **Focused Response Generation** - Section-specific responses (characters, plot, themes, market)
12. ✅ **Anti-Repetition Logic** - Prevents repeating information already shared
13. ✅ **Feature Flag Control** - `ENABLE_CONTEXTUAL_RESPONSES=true` (ACTIVE)

**Enhanced Capabilities** (Phase 3 + 4):
- 60+ enhanced query types across 9 categories (character, story, theme, market, cultural, IP value, production, content, creative team)
- Character details with archetypes and relationships
- Story loglines, conflicts, and narrative structure
- Market positioning and comparable titles
- Source material metrics (views, chapters, platform)
- Korean cultural elements analysis
- **Smart follow-up responses**: 50% token reduction on multi-turn conversations, zero repetition
- Quality threshold: Only uses data with processing_confidence >= 0.70

### Implementation Files
- **Edge Function**: `apps/dashboard/supabase/functions/chat-orchestrator/index.ts`
- **Database Migration**: `apps/dashboard/supabase/migrations/20250130000000_add_pitch_to_vector_search.sql`
- **Frontend**: `apps/dashboard/src/pages/Chat.tsx`
- **Test Suite**: `apps/dashboard/test-chatbot-improvements.js`

### Performance Metrics (Updated with Phase 4)
- **Search Results**: 10 titles with >0.8 similarity scores
- **Response Times**: 3-5 seconds average (with pitch analytics)
- **Hallucination Rate**: <5%
- **Intent Accuracy**: 100%
- **Zero-Results Rate**: ~2%
- **Pitch Coverage**: 30-50% of queries use pitch data (when available)
- **Token Efficiency** (Phase 4): 50% reduction on multi-turn conversations
- **Repetition Rate** (Phase 4): 0% (down from ~70% on follow-ups)
- **Contextual Activation** (Phase 4): ~20-30% of queries use focused responses

### Documentation
- **[Chatbot Overview](docs/features/chatbot/OVERVIEW.md)** - Complete system overview (Phases 1-4)
- **[Phase 1 & 2 Summary](docs/features/chatbot/PHASE_1_2_SUMMARY.md)** - Test results with log evidence
- **[Pitch Analytics](docs/features/chatbot/PITCH_ANALYTICS.md)** - Phase 3 implementation plan
- **[Contextual Responses](docs/features/chatbot/PHASE_4_CONTEXTUAL_RESPONSES.md)** - Phase 4 implementation & testing
- **[Testing Guide](docs/features/chatbot/TESTING_GUIDE.md)** - Testing procedures and log interpretation
- **[AI Chatbot Docs](apps/dashboard/public/docs/AI_CHATBOT_DOCUMENTATION.md)** - User-facing documentation

### Monitoring
- Monitor edge function logs for contextual response activation (`🎯 Contextual Response Analysis`)
- Track token costs (current: $0.015-0.018/query on follow-ups, down from $0.02)
- Review focused response quality and user satisfaction
- Gather user feedback on conversation flow improvements

**Future Phases** (Planned):
- Phase 5: Hybrid search, response caching, analytics dashboard, multi-turn memory (beyond 3 messages)

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
- Default tier: `basic` (changed 2025-08-21)
- Tier hierarchy: basic(1) < pro(2) < suite(3)

**user_creators** (query by `email`):
- `pen_name`: Always use this field (not `pen_name_or_studio`)
- `ip_owner_role`: REQUIRED (author | agent)
- `invitation_status`: invited (default) | active | pending

### Tier System (Buyers)
```typescript
import { useTierAccess } from '@/hooks/useTierAccess';

const { hasAccess, tier } = useTierAccess();
// Automatically synced with Stripe subscriptions
```

### Cache System
```typescript
import { useDataCache } from '@/contexts/DataCacheContext';

const { getData, setData, isSessionValid, isFresh } = useDataCache();

// Session-based only (1-hour expiry)
if (isSessionValid() && isFresh('data')) {
  return getData();
}
```

**See**: [CACHE_POLICY.md](CACHE_POLICY.md) for implementation details

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

### Complete Field List

**Core Fields**:
- `title_id`, `title_name_kr`, `title_name_en`, `is_official_english_title`, `english_title_type`
- `synopsis`, `tagline`, `tagline_kr`, `description_kr`, `note`, `note_kr`

**Authors & Credits**:
- `story_author`, `story_author_kr`, `art_author`, `art_author_kr`
- `original_author`, `original_author_kr`
- `script_title_kr`, `script_title_en`, `art_title_kr`, `art_title_en`
- `underlying_novel_kr`, `underlying_novel_en`, `creator_id`

**Rights & Business**:
- `rights`, `rights_holder_name`, `rights_holder_company`, `cp`, `pitch`

**Content Classification**:
- `genre` (array), `genre_kr` (array), `content_format`, `tone`, `audience`, `age_rating`
- `keywords` (array), `comps` (array)

**Story Details** (Questionnaire - Added 2025-10-24):
- `inspiration`, `important_issues`, `setting_description`
- `world_lore`, `supernatural_concepts`, `character_details` (jsonb)
- `story_structure`, `planned_ending`, `narrative_arc`

**Achievements & Recognition** (Added 2025-10-24):
- `awards` (array), `sales_records`, `merchandise_deals`
- `print_editions`, `print_edition_details`
- `media_coverage`, `celebrity_endorsements`, `creator_achievements` (jsonb)

**Metrics**:
- `views`, `likes`, `rating`, `rating_count`, `chapters`, `completed`, `perfect_for`

**Media**:
- `title_image`, `title_url`

**System**:
- `priority`, `verified`, `created_at`, `updated_at`
- Vector embeddings (1536-dim): `title_embedding`, `synopsis_embedding`, `description_embedding`, `content_embedding`, `combined_embedding`

### Related Tables (Added 2025-10-24)

**title_platforms**: Platform-specific metrics (Naver, Kakao, Lezhin, etc.)
- Fields: `platform_name`, `platform_url`, `views`, `subscribers`, `other_metrics` (jsonb)

**title_documents**: Document attachments (PDFs, scripts, press releases, etc.)
- Fields: `document_type`, `file_url`, `file_name`, `file_size`, `shareable_with_nda`, `external_url`

**title_drafts**: Multi-step questionnaire draft storage
- Fields: `creator_id`, `draft_data` (jsonb), `current_step` (1-5), `last_saved_at`

**title_content_analysis**: AI-generated content analysis (includes `pitch_analysis` for Phase 3 chatbot)
- Fields: `semantic_tags`, `character_types`, `plot_elements`, `cultural_elements`, `pitch_analysis` (jsonb), `processing_confidence`

**See**: [docs/active/DATABASE_SCHEMA.md](docs/active/DATABASE_SCHEMA.md) for complete schema

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