# CLAUDE.md - Dashboard App

**App Scope**: Buyer-focused dashboard with AI chatbot, tier-based access control, premium content, and Stripe integration. **Authentication**: Handles BUYER auth only (creator auth moved to creator app as of 2025-11-04).

**Last Updated**: 2025-11-11

> 📖 **See also**: [Root CLAUDE.md](../../CLAUDE.md) for monorepo commands, shared architecture, and cross-app patterns.

This file provides guidance to Claude Code (claude.ai/code) when working with the Dashboard application.

---

## 📚 Documentation Index

### Essential Docs (Quick Links)
- **[Toast System](docs/TOAST_SYSTEM.md)** - Toast notification implementation and troubleshooting
- **[Pitch Deck System](docs/PITCH_DECK_SYSTEM.md)** - Automated pitch deck extraction (v2.0)
- **[Design Standards](../../docs/active/DESIGN_SYSTEM.md)** - UI/UX standards (root-level)
- **[Auth Documentation](../../docs/active/AUTH_DOCUMENTATION.md)** - Complete auth system reference (root-level)

### Extracted Documentation
Large sections have been extracted to separate files for better organization:
- Toast notifications → `docs/TOAST_SYSTEM.md`
- Pitch deck extraction → `docs/PITCH_DECK_SYSTEM.md`
- Design guidelines → Root `DESIGN_SYSTEM.md`

---

## Development Commands

**From app directory** (`apps/dashboard/`):
- `npm run dev` - Start development server on port 8081
- `npm run build` - Build for production
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

**From root** (with Turborepo, ~50x faster cached builds):
- `npm run dev:dashboard` - Start dashboard only (port 8081)
- `npm run build:dashboard` - Build dashboard with intelligent caching
- `npm run build` - Build all apps (if dashboard dependencies changed)

**Note**: This app runs on port **8081**. Creator app runs on 8083, website on 5173.

---

## Architecture Overview

React-based dashboard built with Vite, TypeScript, and shadcn/ui components. **Primary focus**: Buyer features (AI chatbot, tier system, premium content). Also serves creator dashboard routes temporarily (will migrate to separate creator app).

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **Backend**: Supabase (auth, database)
- **State**: TanStack Query + React Context
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod

### Key Patterns

**Authentication** (CRITICAL - Updated 2025-11-04):
- **This app ONLY handles BUYER authentication** (simplified as of 2025-11-04)
- **Creator authentication** moved to creator app (`creator.kstorybridge.com`)
- Website app redirects buyers here for authentication
- Uses Supabase auth with custom AuthProvider (`src/hooks/useAuth.tsx`)
- All auth flows default to `account_type: 'buyer'` in metadata
- OAuth redirects to `/auth/callback` in THIS app
- **Multi-environment OAuth**: Explicit domain detection for production, staging, and localhost
  - Production: `dashboard.kstorybridge.com/auth/callback`
  - Staging: `dashboard-v2.kstorybridge.com/auth/callback`
  - Localhost: `localhost:8081/auth/callback`

**Auth Pages** (Buyer-only):
- `/signin` - Buyer sign in
- `/signup/buyer` - Buyer signup
- `/auth/callback` - OAuth callback handler (buyer-only)
- `/forgot-password` - Password reset
- ~~`/signup/creator`~~ - **REMOVED** (moved to creator app)
- ~~`/signin/creator`~~ - **REMOVED** (moved to creator app)

**Data Management**:
- Supabase client: `src/integrations/supabase/client.ts`
- Service layer: `src/services/`
- TanStack Query for server state

**Component Structure**:
- shadcn/ui: `src/components/ui/` (auto-generated, avoid editing)
- Custom: `src/components/`
- Layouts: `src/components/layout/`
- Pages: `src/pages/`

### Import Aliases
- `@/*` maps to `./src/*`

### Database
- Migrations: `supabase/migrations/`
- Auto-generated types: `src/integrations/supabase/types.ts`

---

## Performance Optimization

### Tier System Optimization

**Problem**: Individual database queries per component caused slow page loads.

**Solution**: Centralized tier management with React Context.

**Performance Gains**:
- 70-80% faster loading
- 99% fewer database queries (N → 1 per page)

**Usage**:
```jsx
import { TierProvider } from '@/contexts/TierContext';
import OptimizedTierGatedContent from '@/components/OptimizedTierGatedContent';

export default function MyPage() {
  return (
    <TierProvider>
      <MyPageContent />
    </TierProvider>
  );
}

<OptimizedTierGatedContent requiredTier="pro">
  <PremiumContent />
</OptimizedTierGatedContent>
```

**Migrated Pages**: Titles.tsx, TitleDetail.tsx

---

## 📊 Essential Shared Patterns

### Database Operations

**Supabase Config**:
```typescript
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Query Patterns** (CRITICAL):
```typescript
// ✅ CORRECT - Always query by email
.eq('email', user.email?.toLowerCase())

// ❌ INCORRECT - user_id field doesn't exist
.eq('user_id', user.id)
```

### User Tables Structure

**user_buyers** (query by `email`):
- `tier`: basic (default) | invited | pro | suite
- Tier hierarchy: basic(1) < pro(2) < suite(3)
- `full_name`, `buyer_company`, `buyer_role`, `linkedin_url` (optional)

**Field Naming** (CRITICAL):
```typescript
// ✅ CORRECT - Use snake_case matching database
interface BuyerFormData {
  full_name: string;        // NOT fullName
  buyer_company: string;    // NOT buyerCompany
  buyer_role: string;       // NOT buyerRole
  linkedin_url?: string;    // NOT linkedinUrl
  tier?: 'basic' | 'pro' | 'suite';
  requested?: boolean;
}
```

### Tier System Implementation

**Hook Usage**:
```typescript
import { useTierAccess } from '@/hooks/useTierAccess';

const { hasAccess, tier } = useTierAccess();
// Automatically synced with Stripe subscriptions
```

**Context Pattern** (Optimized):
```typescript
import { TierProvider } from '@/contexts/TierContext';
import OptimizedTierGatedContent from '@/components/OptimizedTierGatedContent';

// Wrap page with TierProvider for optimal performance
<TierProvider>
  <OptimizedTierGatedContent requiredTier="pro">
    <PremiumContent />
  </OptimizedTierGatedContent>
</TierProvider>
```

**Tier Levels**:
- `basic` (1) - Free tier, limited access
- `pro` (2) - Pro subscription
- `suite` (3) - Full suite access

### Cache System (Dashboard-Specific)

**Implementation**:
```typescript
import { useDataCache } from '@/contexts/DataCacheContext';

const { getData, setData, isSessionValid, isFresh } = useDataCache();

// Session-based only (1-hour expiry)
if (isSessionValid() && isFresh('data')) {
  return getData();
}
```

**Pattern**: Show errors to users, never use mock data fallback.

**See**: [CACHE_POLICY.md](../../CACHE_POLICY.md) for complete implementation details

---

## 🤖 AI Chatbot System

**Status**: ✅ Phases 1-4 Complete (Contextual Response Generation ACTIVE)

### Overview

AI-powered chatbot for title discovery with vector search, pitch analytics integration, and contextual response generation. Phases 1-4 deployed with 50% token reduction on multi-turn conversations and zero repetition.

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

### Enhanced Capabilities (Phase 3 + 4)

**Query Types** (60+ types across 9 categories):
- Character: Details, archetypes, relationships
- Story: Loglines, conflicts, narrative structure
- Theme: Genre, tone, cultural elements
- Market: Positioning, comparable titles, audience
- Cultural: Korean cultural elements analysis
- IP Value: Rights, adaptability, marketability
- Production: Budget, scope, requirements
- Content: Format, chapters, completion status
- Creative Team: Authors, artists, credentials

**Quality Standards**:
- Only uses data with `processing_confidence >= 0.70`
- Source material metrics (views, chapters, platform)
- Smart follow-up responses with 50% token reduction
- Zero repetition on multi-turn conversations

### Implementation Files

**Edge Function**: `supabase/functions/chat-orchestrator/index.ts`
- Vector search with pitch analytics
- Intent classification
- Contextual response generation
- Anti-hallucination validation

**Database Migration**: `supabase/migrations/20250130000000_add_pitch_to_vector_search.sql`
- Added `pitch_analysis` JSONB field to vector search

**Frontend**: `src/pages/Chat.tsx`
- Chat interface
- Message history
- Title links with fuzzy matching

**Test Suite**: `test-chatbot-improvements.js`
- Comprehensive test coverage
- Log interpretation utilities

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

### Cost Analysis

**Per Query Costs**:
- Initial query: $0.02-0.025
- Follow-up with context: $0.015-0.018 (50% reduction)
- Vector search: Included in Supabase
- Pitch analytics: No additional cost (data already in DB)

**Monthly Estimates** (assuming 1000 queries):
- Without optimization: $20-25/month
- With Phase 4: $15-20/month (25-30% overall reduction)

### Monitoring & Debugging

**Edge Function Logs**:
- Monitor for contextual response activation: `🎯 Contextual Response Analysis`
- Track token costs and usage patterns
- Review focused response quality
- Gather user feedback on conversation flow

**Key Metrics to Track**:
- Token usage per query (should average $0.015-0.020)
- Repetition detection (should be 0%)
- User satisfaction with follow-up responses
- Contextual activation rate (target: 20-30%)

### Documentation

- **[Chatbot Overview](../../docs/features/chatbot/OVERVIEW.md)** - Complete system overview (Phases 1-4)
- **[Phase 1 & 2 Summary](../../docs/features/chatbot/PHASE_1_2_SUMMARY.md)** - Test results with log evidence
- **[Pitch Analytics](../../docs/features/chatbot/PITCH_ANALYTICS.md)** - Phase 3 implementation plan
- **[Contextual Responses](../../docs/features/chatbot/PHASE_4_CONTEXTUAL_RESPONSES.md)** - Phase 4 implementation & testing
- **[Testing Guide](../../docs/features/chatbot/TESTING_GUIDE.md)** - Testing procedures and log interpretation
- **[AI Chatbot Docs](public/docs/AI_CHATBOT_DOCUMENTATION.md)** - User-facing documentation

### Future Phases (Planned)

**Phase 5**: Hybrid search, response caching, analytics dashboard, multi-turn memory (beyond 3 messages)

---

## 🎯 Mandate Matcher

**Status**: ✅ LIVE (Deployed 2025-11-22)

### Overview

AI-powered title recommendation system that matches producer mandates to titles using semantic vector search. Producers describe their requirements in natural language, and the system returns ranked title matches with similarity scores.

### Key Features

**Input**:
- Full-sentence mandate descriptions (max 1000 characters)
- Natural language processing (e.g., "Looking for action-thriller with strong female lead, Korean setting, suitable for streaming")
- Keyboard shortcuts (⌘+Enter to submit)
- Character counter with visual feedback

**Search**:
- OpenAI embeddings (text-embedding-ada-002) for semantic understanding
- Vector similarity search against 245 titles with `combined_embedding`
- Similarity threshold: 0.3 (30% minimum match)
- Returns top 15 most relevant titles

**Results**:
- Beautiful card grid (2-column responsive layout)
- Match score badges with color coding:
  - 🟢 Emerald (85%+): Excellent matches
  - 🔵 Blue (70-84%): Good matches
  - 🟣 Purple (<70%): Fair matches
- Title details: image, genre, tone, synopsis, creators
- Click-to-view full title details

**History Management**:
- Persistent search history (stored in `mandate_searches` table)
- Sidebar with recent searches (chronological, newest first)
- Click to reload previous results
- Delete searches with hover action
- RLS-protected (users only see their own searches)

### Technical Architecture

**Database**:
- Table: `mandate_searches`
- Fields: `mandate_text`, `search_results` (cached JSONB), `result_count`, `avg_match_score`
- RLS policies: User-scoped access
- Migration: `20251121000000_add_mandate_searches_table.sql`

**Edge Function**: `mandate-matcher`
- Location: `supabase/functions/mandate-matcher/index.ts`
- Embedding model: `text-embedding-ada-002` (same as title embeddings)
- RPC: `match_titles_by_embedding_optimized(query_embedding, 0.3, 15)`
- Returns: Top 15 titles with similarity scores

**Service Layer**: `src/services/mandateService.ts`
- Methods: `searchMandates()`, `getRecentMandates()`, `getMandateById()`, `deleteMandate()`
- TypeScript interfaces for type safety

**Components**:
- `MandateInput` - Textarea with character counter, keyboard shortcuts
- `MandateHistorySidebar` - Previous searches with click-to-reload
- `MandateTitleCard` - Title card with match score badge
- `MandateResultsGrid` - 2-column responsive grid

### Performance & Cost

**Performance**:
- Search time: 2-3 seconds average
- Processing: Embedding generation + vector search + database save
- Cached results: Instant reload from history

**Cost Per Search**:
- Embedding: ~$0.0015 (text-embedding-ada-002: $0.0001 per 1K tokens)
- Average mandate: ~15 tokens
- No GPT-4 re-ranking (unlike comps-navigator)
- Very cost-effective for value provided

**Monthly Estimates** (1000 searches):
- Total: ~$1.50/month
- Per user: Negligible (<$0.10/month for active users)

### Route & Navigation

- **Route**: `/buyers/mandates`
- **Navigation**: "Mandate Matcher" in buyer sidebar (between "Comps Navigator" and "Featured")
- **Access**: Buyer accounts only (via `BuyerProtectedLayout`)

### Implementation Files

**Frontend**:
- Page: `src/pages/buyers/Mandates.tsx`
- Components: `src/components/mandates/`
  - `MandateInput.tsx`
  - `MandateHistorySidebar.tsx`
  - `MandateTitleCard.tsx`
  - `MandateResultsGrid.tsx`
- Service: `src/services/mandateService.ts`

**Backend**:
- Edge function: `supabase/functions/mandate-matcher/index.ts`
- Migration: `supabase/migrations/20251121000000_add_mandate_searches_table.sql`
- RPC: Uses existing `match_titles_by_embedding_optimized` function

### Common Issues & Solutions

**Issue**: 0 results returned
- **Cause**: Using wrong embedding model or threshold too high
- **Solution**: Ensure `text-embedding-ada-002` model (same as title embeddings) and threshold ≤ 0.3

**Issue**: Titles don't have embeddings
- **Cause**: `combined_embedding` field is NULL
- **Solution**: Run embedding generation scripts (see `scripts/regenerate-embeddings.js`)

**Issue**: Different embedding models
- **Cause**: Mandate uses different model than titles
- **Solution**: Both must use `text-embedding-ada-002` (1536 dimensions)

### Future Enhancements

- Bookmark favorite mandates
- Name/label mandates for organization
- Share mandate results with team
- Export recommendations as PDF/Excel
- Mandate templates for common scenarios
- AI-generated mandate suggestions

---

## 📄 Pitch Deck Extraction

**Status**: ✅ v2.0 Enhanced Comprehensive Extraction

Automated pitch deck analysis extracting 50+ structured fields using GPT-4o.

- **Admin UI**: `/admin/pitch-extraction-test`
- **Edge Function**: `extract-pitch-test` (v7)
- **Database**: `title_content_analysis` table
- **Cost**: ~$0.15-0.20 per deck

**See**: [Pitch Deck System Documentation](docs/PITCH_DECK_SYSTEM.md)

---

## 🎨 Marketing Asset Generation (ADDED 2025-11-08)

**Status**: ✅ Production-ready with full navigation support

AI-powered marketing asset generation system using GPT-4 and DALL-E 3.

### Overview
Generates 10-15 marketing asset ideas per title (Instagram stories, posters, ad creatives, etc.) with AI-generated DALL-E prompts, then creates actual images on demand.

### Admin Interface

**Main Page**: `/admin/asset-generation`
- Select title from dropdown (shows titles with pitch data)
- Click "Analyze Pitch & Generate Ideas" to create asset concepts (~$0.10-0.15)
- Click "Generate Image" on individual assets to create visuals (~$0.08 per image)
- Approve/manage generated assets

**Direct Navigation** (Added 2025-11-08):
- From Title List (`/admin/titles`) → Click ⚡ Sparkles button
- From Title Detail (`/admin/titles/:id`) → Click "View Assets" button
- URL pattern: `/admin/asset-generation?titleId=xxx` (auto-selects title)

### Technical Architecture

**Database**: `title_marketing_assets` table
- Isolated design (no foreign keys, stores all context)
- Fields: asset type, category, format, prompt, image URL, status, approval
- Supports both generated and pending assets

**Edge Functions**:
- `analyze-pitch-for-assets` - Analyzes pitch deck, generates asset ideas
  - Version: 6 (deployed 2025-11-08)
  - Cost limit: $0.15 per analysis
  - Generates 15 asset ideas grouped by category
- `generate-asset` - Creates actual DALL-E 3 images from prompts
  - Cost: ~$0.04-0.12 per image depending on size/quality

**Storage**: `marketing-assets` bucket
- **Public** bucket for generated images
- Location: Supabase Storage
- RLS policies: Public read, authenticated upload, service role management
- File types: PNG, JPEG, WebP (10 MB limit)

### Asset Categories

1. **Social Media** (5 assets)
   - Instagram Story (1080x1920)
   - Instagram Post (1080x1080)
   - Facebook Post (1200x628)
   - Twitter Post (1200x675)
   - TikTok Video Thumbnail (1080x1920)

2. **Ad Creative** (5 assets)
   - Display Ad (300x250, 728x90)
   - YouTube Thumbnail (1280x720)
   - Video Ad Key Frame (1920x1080)
   - Banner Ad

3. **Pitch Material** (5 assets)
   - Concept Art (1920x1080)
   - Key Scene
   - Character Cards
   - Mood Board
   - Poster

### Navigation Flow

**From Title List**:
```
/admin/titles → Click ⚡ button → /admin/asset-generation?titleId=xxx
```

**From Title Detail**:
```
/admin/titles/:id → Click "View Assets" → /admin/asset-generation?titleId=xxx
```

**Direct Access**:
```
/admin/asset-generation → Manual title selection from dropdown
```

### Common Issues & Solutions

**Issue**: 400 Error - Cost limit exceeded
- **Cause**: Analysis cost > $0.15
- **Solution**: Cost limit increased to $0.15 (2025-11-08)
- **Prevention**: Limit scales with reasonable pitch deck sizes

**Issue**: Images show as corrupted/"Bucket not found"
- **Cause**: Storage bucket was private
- **Solution**: Bucket made public (2025-11-08)
- **Prevention**: Diagnostic scripts in `/scripts/` directory

**Issue**: Generic error messages
- **Cause**: SDK wraps edge function errors
- **Solution**: Enhanced error logging and extraction (2025-11-08)
- **Debugging**: Check browser console for detailed error context

### Diagnostic Tools

Located in `/scripts/` directory:
- `diagnose-asset.js` - Check asset status, test image URLs
- `create-storage-bucket.js` - Create/configure storage buckets
- `make-bucket-public.js` - Fix bucket permissions

**Usage**:
```bash
node scripts/diagnose-asset.js  # Check asset and image accessibility
node scripts/make-bucket-public.js  # Fix storage permissions
```

### Service Functions

**Location**: `src/services/assetGenerationService.ts`

```typescript
// Fetch titles with pitch data
getTitlesWithPitch(): Promise<TitleWithPitch[]>

// Get assets for specific title
getAssetsByTitle(titleId: string): Promise<MarketingAsset[]>

// Get asset count for badge display
getAssetCountByTitle(titleId: string): Promise<number>

// Analyze pitch and generate asset ideas
analyzePitchForAssets(request: AnalyzePitchRequest): Promise<AnalyzePitchResponse>

// Generate actual image with DALL-E 3
generateAsset(request: GenerateAssetRequest): Promise<GenerateAssetResponse>

// Update approval status
updateAssetApproval(assetId, approved, adminEmail): Promise<void>

// Delete asset
deleteAsset(assetId: string): Promise<void>
```

### Components

- `TitleSelector` - Dropdown for title selection
- `AssetIdeaList` - Display generated assets grouped by category
- `AssetGenerationCard` - Individual asset card with generate/approve/delete actions
- `GenerationStats` - Summary statistics (total assets, cost, categories)

### Cost Tracking

**Analysis** (~$0.10-0.15):
- GPT-4 Turbo: $0.01/1K input tokens, $0.03/1K output tokens
- Typical analysis: 8,000-10,000 tokens total
- Includes 15 detailed asset ideas with prompts

**Image Generation** (~$0.04-0.12):
- DALL-E 3 Standard: $0.04 per image
- DALL-E 3 HD: $0.08 per image
- Most assets use standard quality

**Total Per Title**: ~$0.50-1.00 (analysis + 5-10 images)

### Future Enhancements

- Asset count badges on navigation buttons
- Bulk image generation
- Image editing/regeneration
- Video asset support (OpenAI video API)
- Asset templates and styles
- Export/download functionality

---

## Database Schema Guidelines

### Account Types (UPDATED 2024-09-10)

Standardized to `'buyer'` and `'creator'` only.

- ✅ **Buyer**: `account_type: 'buyer'` → `/buyers/home`
- ✅ **Creator**: `account_type: 'creator'` → `/creators/home`

**Tables**:
- `user_buyers` - Buyer profiles
- `user_creators` - Creator profiles

### User Profile Fields

**Buyer Profiles**:
- `tier`: basic (default) | invited | pro | suite
- Default tier: `basic` (changed 2025-08-21)

**Creator Profiles**:
- `pen_name`: Pen name/studio field
- `ip_owner_role`: REQUIRED (author | agent)
- `invitation_status`: invited (default) | active | pending

**Field Naming**: Always use snake_case matching database fields.

---

## Page Access Controls

### Account Type-Based Access (UPDATED 2025-01-14)

**Buyer Access**:
- `/chat` - AI chatbot (changed from admin-only 2025-01-14)
- `/buyers/home`, `/buyers/titles`, `/buyers/saved`, `/buyers/news`

**Admin-Only** (`sungho@dadble.com`, `kevin@sandstoneartists.com`):
- `/experiment` - Feature testing (gateway to admin tools)

**Creator Access**:
- `/creators/home`, `/creators/titles`, `/creators/profile`

---

## Toast Notification System

**CRITICAL**: All dashboard pages MUST import `useToast` from local hook, NOT shared package.

**✅ CORRECT**:
```typescript
import { useToast } from "@/hooks/use-toast";
```

**❌ INCORRECT**:
```typescript
import { useToast } from "@kstorybridge/ui"; // NEVER use in dashboard
```

**Always include both title AND description**:
```typescript
toast({
  title: "Profile Updated",
  description: "Your profile changes have been saved successfully"
});
```

**See**: [Toast System Documentation](docs/TOAST_SYSTEM.md) for complete troubleshooting guide

---

## Design Guidelines

> 🎨 **See [Root DESIGN_SYSTEM.md](../../docs/active/DESIGN_SYSTEM.md)** for complete design standards:
> - Card/Box Standard (transparent backgrounds, no shadows)
> - Button Standard (light grey hover)
> - Typography (SF Pro default)
> - Color Policy (no yellow colors)
> - Pro Tier Color (#AF52DE purple)

**Standard Components**:
- `StandardButton` (`@/components/StandardButton`)
- `StandardCard` (`@/components/StandardCard`)
- `ProBadge` (`@/components/ProBadge`)

**Design System Components** (`@/components/design-system`):
- `Surface` - Replaces `<div>`, semantic layout primitive
- `Stack` / `Inline` - Layout with automatic spacing
- `EmptyState` - Standardized empty states

**Reference Page**: `/buyers/profile` for visual standard

---

## Documentation System

### Adding New Documentation Files

**CRITICAL**: For docs viewable at `/docs/view/[filename].md`, place files in:

**Required Location**: `/apps/dashboard/public/docs/[filename].md`

**Why**: DocumentViewer fetches docs via HTTP from Vite dev server's `public/` directory.

**Process**:
1. Create: `/apps/dashboard/public/docs/your-doc.md`
2. Add entry to: `/apps/dashboard/src/pages/Docs.tsx`
3. Verify: `http://localhost:8081/docs/view/your-doc.md`

---

## Project Tracking

**Active Projects**:
- **PRD 2.1**: Track in `/apps/dashboard/public/docs/project_KSB_2_1.md`

**Guidelines**:
1. Always update project files when completing tasks
2. Use structured tables for status tracking (✅ Complete, 🔄 In Progress, ⏳ Pending)
3. Update "Last Updated" date
4. Verify web accessibility at `/docs/view/project_[NAME].md`

---

## Local Testing Environment

### Localhost OAuth Testing

**Environment Variables**:
- `VITE_SUPABASE_URL` - Local Supabase URL
- `VITE_SUPABASE_ANON_KEY` - Local anon key
- `VITE_LOCAL_TESTING=true` - Enable local mode
- `VITE_OAUTH_TESTING=true` - OAuth debugging
- `VITE_AUTH_DEBUG=true` - Auth debug logs

**Local Supabase**:
```bash
cd supabase
npx supabase start
# Studio: http://localhost:54324
```

**OAuth Config** (Local):
- Site URL: `http://localhost:8081`
- Redirect URLs: `http://localhost:8081/auth/callback`

---

## Development Notes

- TypeScript config relaxed (noImplicitAny: false, strictNullChecks: false)
- ESLint: React + TypeScript, unused vars disabled
- Uses SWC for fast compilation
- Lovable-tagger plugin for dev mode tagging

---

## Quick Links

### Development
- Dashboard: http://localhost:8081
- Supabase: https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd

### Staging
- Dashboard: https://dashboard-v2.kstorybridge.com

### Production
- Dashboard: https://dashboard.kstorybridge.com

### Documentation
- [Root CLAUDE.md](../../CLAUDE.md) - Monorepo documentation
- [Toast System](docs/TOAST_SYSTEM.md) - Toast notifications
- [Pitch Deck System](docs/PITCH_DECK_SYSTEM.md) - Pitch extraction
- [Auth Documentation](../../docs/active/AUTH_DOCUMENTATION.md) - Complete auth reference
- [Design System](../../docs/active/DESIGN_SYSTEM.md) - UI/UX standards
- [Chatbot Overview](../../docs/features/chatbot/OVERVIEW.md) - AI chatbot system

---

**For complete design standards, see [Root DESIGN_SYSTEM.md](../../docs/active/DESIGN_SYSTEM.md)**
**For auth flow details, see [Root AUTH_DOCUMENTATION.md](../../docs/active/AUTH_DOCUMENTATION.md)**
