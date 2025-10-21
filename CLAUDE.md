# CLAUDE.md - KStoryBridge Monorepo

**Last Updated**: 2025-10-21

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
- **[Dashboard App](apps/dashboard/CLAUDE.md)** - Auth, OAuth, tier system, premium content (312 lines, condensed)
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
- **[DEPLOYMENT_STRATEGY.md](docs/guides/DEPLOYMENT_STRATEGY.md)** - Deployment architecture
- **[STRIPE_SETUP_GUIDE.md](docs/guides/STRIPE_SETUP_GUIDE.md)** - Stripe integration
- **[OPENAI_PRODUCTION_SETUP.md](docs/guides/OPENAI_PRODUCTION_SETUP.md)** - OpenAI API setup

---

## 🚀 Quick Start Commands

### Root Level
```bash
npm run dev:dashboard     # http://localhost:8081
npm run dev:website       # http://localhost:5173
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
│   ├── dashboard/     # User dashboard + ALL authentication
│   └── website/       # Marketing website only
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

---

## 🔐 Authentication Flow (UPDATED 2025-10-03)

### User Flow
1. Users visit **Website** (`kstorybridge.com`) for marketing
2. Website redirects to **Dashboard** for auth:
   - `/signup/buyer` - Buyer signup
   - `/signup/creator` - Creator signup (formerly IP Owner)
   - `/signin` - Universal signin
   - `/auth/callback` - OAuth callback (no parameters in URL)
3. After auth, users stay in Dashboard:
   - **Buyers**: Route to `/buyers/home`
   - **Creators**: Route to `/creators/home`

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
- ✅ **Migration workflow**: Create in `apps/*/supabase/migrations/`, never loose SQL files
- **See**: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)

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

**Status**: ✅ Phases 1-3 Complete (Pitch Analytics Integration Deployed)

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

**Enhanced Capabilities** (Phase 3):
- 60+ enhanced query types across 9 categories (character, story, theme, market, cultural, IP value, production, content, creative team)
- Character details with archetypes and relationships
- Story loglines, conflicts, and narrative structure
- Market positioning and comparable titles
- Source material metrics (views, chapters, platform)
- Korean cultural elements analysis
- Quality threshold: Only uses data with processing_confidence >= 0.70

### Implementation Files
- **Edge Function**: `apps/dashboard/supabase/functions/chat-orchestrator/index.ts`
- **Database Migration**: `apps/dashboard/supabase/migrations/20250130000000_add_pitch_to_vector_search.sql`
- **Frontend**: `apps/dashboard/src/pages/Chat.tsx`
- **Test Suite**: `apps/dashboard/test-chatbot-improvements.js`

### Performance Metrics
- **Search Results**: 10 titles with >0.8 similarity scores
- **Response Times**: 3-5 seconds average (with pitch analytics)
- **Hallucination Rate**: <5%
- **Intent Accuracy**: 100%
- **Zero-Results Rate**: ~2%
- **Pitch Coverage**: 30-50% of queries use pitch data (when available)

### Documentation
- **[Chatbot Overview](docs/features/chatbot/OVERVIEW.md)** - Complete system overview
- **[Phase 1 & 2 Summary](docs/features/chatbot/PHASE_1_2_SUMMARY.md)** - Test results with log evidence
- **[Pitch Analytics](docs/features/chatbot/PITCH_ANALYTICS.md)** - Phase 3 implementation plan
- **[Testing Guide](docs/features/chatbot/TESTING_GUIDE.md)** - Testing procedures and log interpretation
- **[AI Chatbot Docs](apps/dashboard/public/docs/AI_CHATBOT_DOCUMENTATION.md)** - User-facing documentation

### Monitoring
- Monitor edge function logs for pitch analytics usage
- Track token costs (target: $0.02/query)
- Review response quality with pitch data enabled
- Gather user feedback on recommendation quality

**Future Phases** (Planned):
- Phase 4: Hybrid search, response caching, analytics dashboard, advanced prompt engineering

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
cd apps/[app]/supabase
npx supabase migration new [name]
npx supabase db reset    # Test locally first
npx supabase db push     # Apply to production
```

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
- **Basic**: `title_id`, `title_name_kr`, `title_name_en`, `description`, `synopsis`, `tagline`, `note`
- **Authors**: `author`, `story_author`, `art_author`, `writer`, `illustrator`
- **Rights**: `rights`, `rights_owner`, `creator_id`
- **Content**: `genre`, `content_format`, `chapters`, `completed`, `tags`
- **Media**: `title_image`, `title_url`, `pitch`
- **Metrics**: `views`, `likes`, `rating`, `rating_count`
- **Market**: `perfect_for`, `comps` (array), `tone`, `audience`
- **System**: `created_at`, `updated_at`

**See**: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for complete schema

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
- Website: http://localhost:5173
- Supabase: https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd

### Production
- Dashboard: https://dashboard.kstorybridge.com
- Website: https://kstorybridge.com

### Documentation
All comprehensive documentation is in root-level `.md` files. This file provides quick reference only - refer to specific documentation files for detailed implementation guidance.
- never use parameters in oauth callback URL 
- never ever use parameter in oauth callback URL!!!