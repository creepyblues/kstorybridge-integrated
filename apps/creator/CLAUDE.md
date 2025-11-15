# CLAUDE.md - Creator App V2

**App Scope**: Creator-focused dashboard for content management, title submissions, and profile management. Dedicated app for Korean content creators (webtoon artists, web novel authors, agents).

**Last Updated**: 2025-11-12

**Status**: ✅ PRODUCTION - Primary creator app (V1 archived as reference)

> 📖 **See also**: [Root CLAUDE.md](../../CLAUDE.md) for monorepo commands, shared architecture, and cross-app patterns.

This file provides guidance to Claude Code (claude.ai/code) when working with the Creator V2 application.

---

## 📚 Documentation Index

### Essential Docs (Quick Links)
- **[Creator V2 Rebuild Plan](../../docs/CREATOR_APP_V2_REBUILD_PLAN.md)** - Complete V2 build history and phases
- **[Creator V2 PRD](../../docs/CREATOR_APP_V2_PRD.md)** - Product requirements document
- **[Design Standards](../../docs/active/DESIGN_SYSTEM.md)** - UI/UX standards (root-level)
- **[Auth Documentation](../../docs/active/AUTH_DOCUMENTATION.md)** - Complete auth system reference (root-level)
- **[Database Schema](../../docs/active/DATABASE_SCHEMA.md)** - Database schema reference

### Deployment Docs (In App Directory)
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Vercel deployment instructions
- **[OAUTH_SETUP.md](./OAUTH_SETUP.md)** - OAuth configuration guide
- **[PRODUCTION_TEST_REPORT.md](./PRODUCTION_TEST_REPORT.md)** - Production verification tests
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Manual testing checklist

---

## Development Commands

**From app directory** (`apps/creator/`):
- `npm run dev` - Start development server on port 8083
- `npm run build` - Build for production
- `npm run build:dev` - Development build (with source maps)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

**From root** (with Turborepo, ~50x faster cached builds):
- `npm run dev:creator` - Start creator only (port 8083)
- `npm run build:creator` - Build creator with intelligent caching
- `npm run build` - Build all apps

**Note**: This app runs on port **8083**. Dashboard app runs on 8081, website on 5173.
**Turborepo**: Creator has no shared package dependencies, so it only rebuilds when `apps/creator/` or root configs change.

---

## Architecture Overview

React-based creator dashboard built from scratch to eliminate OAuth authentication issues. **Exclusively for creators** - clean URLs without `/creators` prefix for professional appearance.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **Backend**: Supabase (auth, database) - shared with dashboard
- **State**: TanStack Query + React Context
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod

### Key Improvements Over V1
- ✅ **Clean auth implementation** - No race conditions, single auth listener
- ✅ **account_type set during signup** - No separate updateUser() call needed
- ✅ **OAuth works perfectly** - Sequential operations, no deadlocks
- ✅ **No dashboard dependencies** - Fully independent codebase
- ✅ **Better title forms** - All database fields supported (vs V1's 7 fields)
- ✅ **Simpler codebase** - ~300 lines of auth code vs V1's 800+

### Key Patterns

**Authentication**:
- Simple auth service: `src/lib/auth.ts` (240 lines)
- Single auth listener: `src/hooks/useAuth.tsx` (55 lines)
- Supabase client: `src/lib/supabase.ts` (17 lines)
- account_type='creator' set **during** signup (not after)
- OAuth: Sequential operations (exchange → profile → metadata)
- No session health checks, no race conditions

**Auth Pages** (Creator-only):
- `/signin` - Creator sign in
- `/signup` - Creator signup
- `/auth/callback` - OAuth callback handler
- `/complete-profile` - OAuth profile completion (pen_name, role, etc.)

**Routing Philosophy**:
- **Clean URLs**: No `/creators` prefix (e.g., `/home` not `/creators/home`)
- **Professional**: Easier for marketing and creator communication
- **Dedicated**: All routes are creator-specific, no buyer routes

**Data Management**:
- Supabase client: `src/integrations/supabase/client.ts`
- Services: `src/services/titlesService.ts`
- TanStack Query for server state
- Shared database with dashboard app (same Supabase project: `dlrnrgcoguxlkkcitlpd`)

**Component Structure**:
- shadcn/ui: `src/components/ui/` (auto-generated, avoid editing)
- Custom components: `src/components/`
- Layouts: `src/components/layout/` (includes CMSSidebar for creator menu)
- Pages: `src/pages/`

### Import Aliases
- `@/*` maps to `./src/*`

### Database
- Migrations: Use root-level `/supabase/migrations/` (centralized)
- Auto-generated types: `src/integrations/supabase/types.ts`
- Shared Supabase project: `dlrnrgcoguxlkkcitlpd`
- Query pattern: Always use `.eq('email', user.email)` (never `user_id`)

---

## Creator App Routes

### Main Routes (Clean URLs)
- `/` - Redirects to `/home` or `/signin` (if not authenticated)
- `/home` - Creator dashboard home
- `/titles` - My titles list
- `/titles/add-title` - Add new title (multi-step survey form)
- `/titles/:titleId` - Title detail view
- `/titles/:titleId/edit` - Edit title
- `/profile` - Creator profile management
- `/plan` - Subscription plans (Stripe checkout) - ✅ **LIVE**
- `/billing` - Billing & subscriptions page - ✅ **LIVE**
- `/payment/success` - Payment success redirect - ✅ **LIVE**
- `/requests` - My requests (buyer inquiries) - **Skeleton**
- `/news` - Platform news - **Skeleton**

### Auth Routes
- `/signin` - Sign in page
- `/signup` - Sign up page
- `/auth/callback` - OAuth callback handler
- `/complete-profile` - OAuth profile completion

---

## Key Features

### 1. Title Management (CRUD)
**Location**: `src/services/titlesService.ts`

**Operations**:
- `getTitlesByCreator(email)` - Fetch all titles for creator
- `getTitleById(titleId)` - Fetch single title
- `createTitle(titleData)` - Create new title
- `updateTitle(titleId, updates)` - Update existing title
- `deleteTitle(titleId)` - Delete title

**Forms**:
- **AddTitle**: Multi-step survey form (`src/pages/AddTitle.tsx`)
  - Step 1: Basic Info (title_name_kr, genre, format, etc.)
  - Step 2: Story Details (inspiration, themes, world-building, etc.)
  - Step 3: Achievements (awards, sales, media coverage, etc.)
  - Step 4: Platform Metrics (views, chapters, rating, etc.)
  - Step 5: Documents (pitch decks, scripts, press releases, etc.)
- **EditTitle**: Single-page form with all fields (`src/pages/EditTitle.tsx`)

**Components**:
- `src/components/TitleCard.tsx` - Title list item
- Survey components in `src/components/survey/`

### 2. Profile Management
**Location**: `src/pages/Profile.tsx`

**Features**:
- View/edit pen_name, full_name, company, website
- Email display (read-only)
- Account creation date
- Edit mode with form validation

### 3. Subscription & Billing (Stripe Integration)
**Status**: ✅ LIVE (2025-11-14)
**Location**: `src/pages/Billing.tsx`, `src/components/CheckoutModal.tsx`

**Features**:
- **Per-Title Subscriptions**: Each title requires separate subscription
- **Two Plans**: Packaging ($100-200/mo) and Premium ($200-400/mo)
- **Billing Options**: Monthly or yearly
- **Environment-Based**: Staging uses test mode, production uses live mode

**Plans**:
- **Packaging Plan** (Launch Promo):
  - Monthly: $100/month
  - Yearly: $1,000/year
  - Features: Basic packaging and distribution support

- **Premium Plan** (Launch Promo):
  - Monthly: $200/month
  - Yearly: $2,000/year
  - Features: Advanced packaging, priority support, analytics

**Checkout Flow**:
1. Creator goes to `/plan` page
2. Selects plan (Packaging or Premium)
3. Selects billing period (Monthly or Yearly)
4. Selects title from dropdown
5. Redirected to Stripe checkout
6. Completes payment
7. Webhook creates subscription record
8. Returns to billing page to see active subscription

**Billing Page**:
- Active subscriptions by title
- Transaction history
- Payment method information
- Next billing date

**Environment Detection**:
- Staging (creator-staging.kstorybridge.com) → Stripe Test Mode
- Production (creator.kstorybridge.com) → Stripe Live Mode
- Localhost (localhost:8083) → Stripe Test Mode

**Edge Functions**:
- `create-creator-checkout` - Creates Stripe checkout sessions
- `creator-stripe-webhook` - Processes payment events
- `get-creator-billing-history` - Fetches subscription/transaction data

**Database Tables**:
- `creator_subscriptions` - Subscription records (per-title)
- `creator_stripe_customers` - Stripe customer mapping
- `creator_payments` - Transaction history

**See Also**:
- [Stripe Payment Integration](../../docs/STRIPE_PAYMENT_INTEGRATION.md) - Complete implementation guide
- [Stripe Configuration Reference](../../docs/STRIPE_CONFIGURATION_REFERENCE.md) - Configuration and troubleshooting

### 4. Authentication System
**Email Signup**:
```typescript
// Sets account_type during signup (atomic operation)
await signUpWithEmail(email, password, { pen_name, full_name, ip_owner_role, ... })
```

**OAuth Signup** (Multi-Environment Support):
```typescript
// Explicit domain handling (src/lib/auth.ts:150-159)
const isStaging = window.location.hostname === 'creator-staging.kstorybridge.com'
const isProduction = window.location.hostname === 'creator.kstorybridge.com'

const redirectUrl = isStaging
  ? 'https://creator-staging.kstorybridge.com/auth/callback'
  : isProduction
  ? 'https://creator.kstorybridge.com/auth/callback'
  : `${window.location.origin}/auth/callback`  // Localhost

// Sequential operations (no race conditions)
1. Initiate OAuth with explicit redirect URL
2. Google redirects back to correct domain
3. Exchange code for session (check-then-fallback pattern)
4. Create user_creators profile
5. Set account_type='creator' metadata
```

**OAuth Signin** (Check-Then-Fallback Pattern):
```typescript
// src/pages/auth/AuthCallback.tsx:18-56
// Check if automatic exchange succeeded first
let { data: { session } } = await supabase.auth.getSession()

if (session) {
  // Automatic exchange succeeded, use existing session
} else {
  // Fallback: Explicit exchange if automatic failed
  const result = await supabase.auth.exchangeCodeForSession(code)
  session = result.data.session
}
```

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

**user_creators** (query by `email`):
- `pen_name`: Always use this field (not `pen_name_or_studio`)
- `ip_owner_role`: REQUIRED (author | agent)
- `invitation_status`: invited (default) | active | pending
- `full_name`, `ip_owner_company` (optional), `website_url` (optional)

**Field Naming** (CRITICAL):
```typescript
// ✅ CORRECT - Use snake_case matching database
interface CreatorFormData {
  full_name: string;           // NOT fullName
  pen_name: string;            // NOT penNameOrStudio
  ip_owner_role: string;       // NOT ipOwnerRole (REQUIRED)
  ip_owner_company?: string;   // NOT ipOwnerCompany
  website_url?: string;        // NOT websiteUrl
  invitation_status?: string;
}
```

---

## 📚 Content Management (Titles Table)

### Complete Field List

**Core Fields**:
- `title_id` (uuid, primary key)
- `title_name_kr` (text, NOT NULL) - Korean title
- `title_name_en` (text) - English title
- `is_official_english_title` (boolean) - Whether English title is official
- `english_title_type` (text) - Type: official | literal | marketing
- `synopsis` (text) - English synopsis
- `tagline` (text) - English tagline
- `tagline_kr` (text) - Korean tagline
- `description_kr` (text) - Korean description
- `note` (text) - Internal notes (English)
- `note_kr` (text) - Internal notes (Korean)

**Authors & Credits**:
- `story_author` (text) - Story author name (English)
- `story_author_kr` (text) - Story author name (Korean)
- `art_author` (text) - Art author name (English)
- `art_author_kr` (text) - Art author name (Korean)
- `original_author` (text) - Original author if adapted (English)
- `original_author_kr` (text) - Original author if adapted (Korean)
- `script_title_kr` (text) - Script/webtoon title (Korean)
- `script_title_en` (text) - Script/webtoon title (English)
- `art_title_kr` (text) - Art/webtoon title (Korean)
- `art_title_en` (text) - Art/webtoon title (English)
- `underlying_novel_kr` (text) - Source novel title (Korean)
- `underlying_novel_en` (text) - Source novel title (English)
- `creator_id` (text) - Associated creator email

**Rights & Business**:
- `rights` (text) - **DEPRECATED** - Use `rights_available` instead
- `rights_available` (text[], array) - Multi-select rights available for licensing
  - Valid values: `film_tv`, `animation`, `publication`, `merchandising`, `game`, `other`
  - UI: Checkbox group in Step 1 of AddTitle/EditTitle forms
  - Migrated: 2025-11-12 (244 titles migrated from old `rights` field)
- `rights_holder_name` (text) - Rights holder name
- `rights_holder_company` (text) - Rights holder company
- `cp` (text) - Content provider/studio
- `pitch` (text) - Pitch deck description

**Content Classification**:
- `genre` (text[], array) - Genre tags (e.g., ["romance", "fantasy"])
- `genre_kr` (text[], array) - Korean genre tags
- `content_format` (text) - Format: webtoon | web_novel | light_novel | manga
- `tone` (text) - Tone: lighthearted | serious | dark | comedic
- `audience` (text) - Target audience
- `age_rating` (text) - Age rating
- `keywords` (text[], array) - Searchable keywords
- `comps` (text[], array) - Comparable titles/IPs

**Story Details** (Questionnaire - Added 2025-10-24):
- `inspiration` (text) - What inspired this story
- `important_issues` (text) - Themes and issues explored
- `setting_description` (text) - Story setting details
- `world_lore` (text) - World-building and lore
- `supernatural_concepts` (text) - Supernatural elements
- `character_details` (jsonb) - Character descriptions (structured)
- `story_structure` (text) - Narrative structure
- `planned_ending` (text) - Ending description/type
- `narrative_arc` (text) - Story arc description

**Achievements & Recognition** (Added 2025-10-24):
- `awards` (text[], array) - Awards received
- `sales_records` (text) - Sales achievements
- `merchandise_deals` (text) - Merchandising deals
- `print_editions` (boolean) - Has print editions
- `print_edition_details` (text) - Print edition info
- `media_coverage` (text) - Press coverage details
- `celebrity_endorsements` (text) - Celebrity endorsements
- `creator_achievements` (jsonb) - Creator accomplishments (structured)

**Metrics**:
- `views` (bigint) - Total views
- `likes` (integer) - Total likes
- `rating` (numeric) - Average rating (0-10)
- `rating_count` (integer) - Number of ratings
- `chapters` (integer) - Number of chapters/episodes
- `completed` (boolean) - Is series completed
- `perfect_for` (text) - "Perfect for fans of..."

**Media**:
- `title_image` (text) - Cover/poster image URL
- `title_url` (text) - External URL to original content

**System Fields**:
- `priority` (integer) - Display priority/ranking
- `verified` (boolean) - Verification status
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Vector Embeddings** (1536-dim for AI search):
- `title_embedding` (vector) - Title name embedding
- `synopsis_embedding` (vector) - Synopsis embedding
- `description_embedding` (vector) - Description embedding
- `content_embedding` (vector) - Combined content embedding
- `combined_embedding` (vector) - All fields combined

### Related Tables (Added 2025-10-24)

**title_platforms**: Platform-specific metrics (Naver, Kakao, Lezhin, etc.)
- `id` (uuid, primary key)
- `title_id` (uuid, foreign key → titles.title_id)
- `platform_name` (text) - Platform name
- `platform_url` (text) - Link to title on platform
- `views` (bigint) - Platform-specific views
- `subscribers` (integer) - Platform-specific subscribers
- `other_metrics` (jsonb) - Additional platform metrics (structured)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**title_documents**: Document attachments (PDFs, scripts, press releases, etc.)
- `id` (uuid, primary key)
- `title_id` (uuid, foreign key → titles.title_id)
- `document_type` (text) - Type: pitch_deck | script | press_release | etc.
- `file_url` (text) - Supabase storage URL
- `file_name` (text) - Original filename
- `file_size` (bigint) - File size in bytes
- `shareable_with_nda` (boolean) - Requires NDA to share
- `external_url` (text) - External link (if not uploaded)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**title_drafts**: Multi-step questionnaire draft storage
- `id` (uuid, primary key)
- `creator_id` (text) - Creator email
- `draft_data` (jsonb) - Draft form data (structured)
- `current_step` (integer) - Current step (1-5)
- `last_saved_at` (timestamptz) - Auto-save timestamp
- `created_at` (timestamptz)

**title_content_analysis**: AI-generated content analysis
- `id` (uuid, primary key)
- `title_id` (uuid, foreign key → titles.title_id)
- `semantic_tags` (text[]) - AI-extracted semantic tags
- `character_types` (text[]) - Character archetypes
- `plot_elements` (text[]) - Plot components
- `cultural_elements` (text[]) - Cultural themes
- `pitch_analysis` (jsonb) - Structured pitch deck analysis (for Phase 3 chatbot)
- `processing_confidence` (numeric) - AI confidence score (0-1)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### Query Patterns

**Fetch all titles for a creator**:
```typescript
const { data: titles } = await supabase
  .from('titles')
  .select('*')
  .eq('creator_id', user.email)
  .order('created_at', { ascending: false })
```

**Create title with minimal data**:
```typescript
const { data, error } = await supabase
  .from('titles')
  .insert({
    title_name_kr: 'Title Name',
    creator_id: user.email,
    content_format: 'webtoon',
    genre: ['romance', 'fantasy'],
    // Other fields optional
  })
  .select()
  .single()
```

**Update title**:
```typescript
const { data, error } = await supabase
  .from('titles')
  .update({
    synopsis: 'Updated synopsis',
    rating: 8.5,
    updated_at: new Date().toISOString()
  })
  .eq('title_id', titleId)
  .select()
  .single()
```

**Add platform metrics**:
```typescript
const { data, error } = await supabase
  .from('title_platforms')
  .insert({
    title_id: titleId,
    platform_name: 'Naver Webtoon',
    platform_url: 'https://comic.naver.com/...',
    views: 1500000,
    subscribers: 50000,
    other_metrics: { rating: 9.8, episodes: 120 }
  })
```

**See**: [docs/active/DATABASE_SCHEMA.md](../../docs/active/DATABASE_SCHEMA.md) for complete schema reference

---

## Design System

### Color Palette
- **Primary Text**: `text-black`
- **Neutrals**: `gray-50`, `gray-100`, `gray-200`, `gray-300`, `gray-500`, `gray-900`
- **Status**: `red-*` (error), `green-*` (success), `blue-*` (info), `amber-*` (drafts)
- ❌ **NEVER**: Yellow colors (`bg-yellow-*`, yellow hex values)

### Standard Components

**Card** (Base component for sections):
```tsx
<Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6 sm:mb-8 lg:mb-12">
  <CardContent className="p-4 sm:p-6">...</CardContent>
</Card>
```

**Button**:
```tsx
// Outline (default)
<Button variant="outline" className="border-gray-300 hover:bg-gray-100">
  Button Text
</Button>

// Primary CTA (submit actions)
<Button className="bg-black text-white hover:bg-gray-800">
  Submit
</Button>
```

**Badge** (Status indicators):
```tsx
// Standard badge - ALWAYS use px-2.5 py-0.5 rounded-full
<span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500 text-white">
  DRAFT
</span>
```

**Hover Effects**:
```tsx
// Cards - Use border color transitions, NOT shadows
<Card className="... hover:border-gray-400 transition-colors">

// ❌ WRONG - No shadow-lg or shadow-xl
<Card className="... hover:shadow-lg transition-shadow">
```

### Standard Page Structure

All pages MUST follow this consistent structure:

**Page Container**:
```tsx
<MainLayout>
  <div className="max-w-7xl mx-auto">
    {/* Page content */}
  </div>
</MainLayout>
```

**Page Header**:
```tsx
<div className="mb-6 sm:mb-8">
  <h1 className="text-2xl sm:text-3xl font-bold text-black">Page Title</h1>
  <p className="text-gray-600 mt-2">Optional subtitle</p>
</div>
```

**Loading/Error/Empty States**:
```tsx
// Loading
{loading && (
  <div className="text-center py-12">
    <p className="text-gray-500">Loading...</p>
  </div>
)}

// Error
{error && (
  <div className="text-center py-12">
    <p className="text-red-500">{error}</p>
    <Button onClick={handleRetry} variant="outline" className="mt-4 border-gray-300 hover:bg-gray-100">
      Retry
    </Button>
  </div>
)}

// Empty
{!loading && !error && items.length === 0 && (
  <div className="text-center py-12">
    <p className="text-gray-500">No items found</p>
  </div>
)}
```

**Page Structure Requirements**:
- **Container**: `max-w-7xl mx-auto` (not `max-w-6xl` or `max-w-4xl`)
- **Page Title**: `text-2xl sm:text-3xl font-bold text-black` (responsive)
- **Title Margin**: `mb-6 sm:mb-8` (responsive)
- **Title Color**: `text-black` (not `text-gray-900`)
- **Loading State**: Simple text, no spinners
- **Error State**: `text-red-500`, no red borders on cards
- **Error Cards**: Use `border-gray-300`, not `border-red-300`

### Responsive Margins

Use responsive margin pattern for section-level cards:
```tsx
// ✅ CORRECT - Responsive margins
mb-6 sm:mb-8 lg:mb-12

// ❌ WRONG - Static margins
mb-6
mb-8
```

### White Background Exceptions

The design system mandates `bg-transparent` for cards, but these exceptions are acceptable:

1. **Form inputs** - `bg-white` (required for usability)
2. **Navigation sidebars** - `bg-white` (standard pattern)
3. **Mobile menu overlays** - `bg-white` with `shadow-sm` (depth perception)
4. **Content cards with images** - Can use `bg-white` or gradients for draft status differentiation

### Design Reference

**✅ Standard Pages**: All creator pages follow consistent structure
- `src/pages/Titles.tsx` - List page with grid layout
- `src/pages/Profile.tsx` - Form page with card sections
- `src/pages/AddTitle.tsx` - Multi-step form
- `src/pages/EditTitle.tsx` - Edit form with tabs
- `src/pages/TitleDetail.tsx` - Detail view page

**Reference**: [DESIGN_SYSTEM.md](../../docs/active/DESIGN_SYSTEM.md) for complete guidelines

---

## Deployment

### Production
- **URL**: https://creator.kstorybridge.com
- **Platform**: Vercel
- **Branch**: Deploy from `main` branch
- **OAuth**: Configured for production callback URLs

### Staging
- **URL**: https://creator-staging.kstorybridge.com
- **Platform**: Vercel
- **Branch**: Deploy from `v2` branch
- **OAuth**: Configured for staging callback URLs

### Multi-Environment OAuth Support
All environments use **explicit domain detection** for OAuth redirects:
- Production: `creator.kstorybridge.com/auth/callback`
- Staging: `creator-staging.kstorybridge.com/auth/callback`
- Localhost: `localhost:8083/auth/callback`

**No environment variables needed** for redirect URLs - detection is automatic based on hostname.

### Environment Variables (Vercel)
```bash
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=[anon_key]
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete instructions.
See [OAUTH_SETUP.md](./OAUTH_SETUP.md) for OAuth configuration details.

---

## Critical Rules

### Authentication
- ✅ **OAuth multi-environment**: Use explicit domain detection pattern (staging, production, localhost)
- ✅ **Check-then-fallback**: Check automatic code exchange before explicit exchange (prevents 400 errors)
- ✅ **account_type**: Set during signup in metadata, never default assignment
- ✅ **Single auth listener**: One listener in AuthProvider, no competing listeners
- ✅ **Sequential OAuth**: Exchange code → Create profile → Set metadata (never concurrent)

### Database
- ✅ **Query pattern**: `.eq('email', user.email.toLowerCase())` (always use `email`)
- ❌ **Never use**: `user_id` field (doesn't exist in user tables)
- ✅ **Migrations**: Create in root `/supabase/migrations/` (never app-specific)

### Design System
- ❌ **NEVER**: Yellow colors (`bg-yellow-*`, yellow hex values)
- ✅ **Cards**: `bg-transparent border-gray-300 shadow-none rounded-2xl`
- ✅ **Buttons**: `variant="outline" border-gray-300 hover:bg-gray-100`
- ✅ **Font**: SF Pro (automatic, no class needed)

---

## Common Tasks

### Adding a New Page
1. Create page in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/components/layout/CMSSidebar.tsx` (if needed)
4. Wrap with `<ProtectedRoute>` if authentication required

### Updating Title Fields
1. Check database schema: `/docs/active/DATABASE_SCHEMA.md`
2. Update form in `src/pages/AddTitleSurvey.tsx` or `EditTitle.tsx`
3. Update service in `src/services/titlesService.ts`
4. Update TypeScript types if needed

### Testing OAuth Locally
1. Add `http://localhost:8083/auth/callback` to:
   - Google OAuth Console (Authorized redirect URIs)
   - Supabase Auth Settings (Redirect URLs)
2. Start dev server: `npm run dev`
3. Test signup and signin flows
4. Check browser console for errors

---

## Known Issues

**None** - All major issues resolved:
- ✅ OAuth signup/signin working perfectly
- ✅ Title edit save bug fixed (2025-10-26)
- ✅ Profile management working
- ✅ All CRUD operations functional

---

## 📝 Recent Changes

### 2025-11-12: Rights Field Converted to Multi-Select
- **Changed**: `rights` (text) → `rights_available` (text[] array)
- **Migration**: 244 titles successfully migrated
- **UI**: New checkbox group in Step 1 (AddTitle/EditTitle forms)
- **Options**: Film & TV, Animation, Publication, Merchandising, Game, Other
- **Component**: `RightsCheckboxGroup.tsx`
- **Files Modified**:
  - Database: `/supabase/migrations/20251112000000_convert_rights_to_array.sql`
  - Types: `src/services/titlesService.ts`
  - Component: `src/components/survey/RightsCheckboxGroup.tsx`
  - Form: `src/components/survey/Step1BasicInfo.tsx`
  - Validation: `src/lib/surveySchema.ts`
  - i18n: `src/i18n/locales/{en,ko}/survey.json`

### 2025-11-11: CMS Content Integration
- **Added**: Home page now displays news and learning posts from `content_posts` table
- **Service**: `src/services/contentService.ts` added
- **Updates Section**: Shows 3 recent news posts (category='news')
- **Learning Center Section**: Shows 3 recent learning posts (category='learning')
- **Navigation**: Links to `/news/{slug}` and `/learning-center/{slug}`

---

## 🔗 Related Documentation

### Root Documentation
- [Root CLAUDE.md](../../CLAUDE.md) - Monorepo overview
- [Auth Documentation](../../docs/active/AUTH_DOCUMENTATION.md)
- [Database Schema](../../docs/active/DATABASE_SCHEMA.md)
- [Design System](../../docs/active/DESIGN_SYSTEM.md)

### Creator V2 Specific
- [Creator V2 Rebuild Plan](../../docs/CREATOR_APP_V2_REBUILD_PLAN.md)
- [Creator V2 PRD](../../docs/CREATOR_APP_V2_PRD.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [OAuth Setup](./OAUTH_SETUP.md)

### Legacy Reference
- [Creator V1 CLAUDE.md](../creator-v1/CLAUDE.md) - Archived, reference only

---

**Last Updated**: 2025-11-12
**Status**: ✅ PRODUCTION READY
**Version**: 2.0.0
