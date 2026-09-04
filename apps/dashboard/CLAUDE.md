# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last Updated**: 2026-01-11

---

## 📁 Project Overview

**Dashboard** is the primary buyer-focused dashboard for KStoryBridge (v2.0 - clean rebuild), featuring:
- AI chatbot (Jinu) with GPT-4 + vector search
- **Comps Navigator** - AI-powered Korean title discovery using Hollywood comps
- Tier system (basic/pro/suite) with content gating
- Title discovery with search, filters, and favorites
- Stripe subscription integration
- Admin panel for title management
- **GA4 Analytics** - Event tracking for user behavior (ID: `G-DWL6MV0MC2`)
- **Welcome Emails** - Automated welcome emails on signup (email & OAuth)
- **All email addresses allowed** (no work email restriction)

**Port**: 8081 (development)
**Production URL**: https://dashboard.kstorybridge.com

This is part of a monorepo with separate creator and website apps, all sharing the same Supabase database (`dlrnrgcoguxlkkcitlpd`).

---

## 🚀 Development Commands

### From this directory (`apps/dashboard/`)
```bash
npm install                # Install dependencies
npm run dev                # Start dev server (port 8081)
npm run build              # Production build
npm run build:dev          # Development build
npm run lint               # Run ESLint
npm run preview            # Preview production build
```

### From project root (`/Users/sungholee/code/kstorybridge/`)
```bash
npm run dev:dashboard      # Alternative way to start dev server
npm run build:dashboard    # Build dashboard only
npm run build:all          # Build all apps in monorepo
npm run lint:all           # Lint all apps
```

---

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript (strict mode) + Vite
- **Styling**: Tailwind CSS + shadcn/ui + Radix UI
- **Backend**: Supabase (shared project: `dlrnrgcoguxlkkcitlpd`)
- **State**: TanStack Query + React Context (TierContext)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Payments**: Stripe (test/live mode)

### Project Structure
```
apps/dashboard/
├── src/
│   ├── components/
│   │   ├── chat/              # ChatMessage, ChatInput, ChatEmptyState, TitleCard
│   │   ├── tier/              # ProBadge, TierGatedContent
│   │   ├── layout/            # BuyerLayout, AdminLayout, BuyerSidebar
│   │   ├── ui/                # shadcn/ui base components
│   │   └── ProtectedRoute.tsx # Auth guard component
│   ├── contexts/
│   │   └── TierContext.tsx    # Tier access control (basic/pro/suite)
│   ├── hooks/
│   │   ├── useAuth.tsx        # Auth context & hook
│   │   └── use-toast.tsx      # Toast notifications
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client initialization
│   │   └── auth.ts            # Auth service (~350 lines)
│   ├── pages/
│   │   ├── auth/              # SignIn, SignUp, AuthCallback, CompleteProfile
│   │   ├── buyers/            # Chat, Titles, TitleDetail, Saved, Profile, Plan, Checkout
│   │   └── admin/             # AdminTitles
│   ├── services/
│   │   ├── chatOrchestratorService.ts  # AI chatbot wrapper
│   │   └── titlesService.ts            # Title CRUD operations
│   ├── App.tsx                # Main router with all routes
│   └── main.tsx               # React entry point
├── supabase/functions/
│   ├── create-checkout-session/   # Stripe checkout edge function
│   └── stripe-webhook/             # Stripe webhook handler
├── .env.local                 # Local environment variables
├── package.json               # Dependencies (port 8081)
├── vite.config.ts             # Vite config with @ path alias
└── README.md                  # Detailed documentation
```

### Path Aliases
- `@/*` → `./src/*` (configured in `tsconfig.json` and `vite.config.ts`)
- Example: `import { supabase } from '@/lib/supabase'`

---

## 🔑 Core Patterns

### Authentication System

**Key Principles**:
- ✅ **Query by email, never by user_id**: Database tables don't have `user_id` field
- ✅ **Profile existence = valid account**: No auto-profile creation
- ✅ **Sequential operations**: No race conditions in signup flow
- ✅ **Single auth listener**: Prevents competing listeners
- ✅ **OAuth uses sessionStorage**: No URL parameters per CLAUDE.md rules
- ✅ **All emails allowed**: Personal and work email domains accepted

**Code Location**: `src/lib/auth.ts` (~350 lines of clean auth code)

**Auth Flow**:
1. User signs up → Email validation
2. Edge function creates profile (bypasses RLS)
3. Session created → Redirect to `/buyers/chat`
4. `AuthProvider` wraps app → `useAuth()` hook available everywhere

**Example**:
```typescript
import { useAuth } from '@/hooks/useAuth';

const { user, profile, loading, signOut } = useAuth();

// Query pattern (CORRECT)
const { data } = await supabase
  .from('user_buyers')
  .select('*')
  .eq('email', user.email?.toLowerCase())
  .single();

// NEVER use .eq('user_id', user.id) - field doesn't exist
```

### Tier System

**Tier Hierarchy**: invited(0) < basic(1) < pro(2) < suite(3)

**Implementation**:
- `TierContext.tsx` provides `hasAccess(requiredTier)` function
- Single database query on mount (cached in context)
- Automatic tier display with `ProBadge` component
- Tier-gated content with `TierGatedContent` wrapper

**Example**:
```typescript
import { useTierAccess } from '@/hooks/useTierAccess';

const { hasAccess, tier } = useTierAccess();

if (!hasAccess('pro')) {
  return <TierGatedContent requiredTier="pro">
    <PitchDeckContent />
  </TierGatedContent>;
}
```

### Database Queries

**Always query by email**:
```typescript
// ✅ CORRECT
.eq('email', user.email?.toLowerCase())

// ❌ WRONG
.eq('user_id', user.id)
```

**Tables Used**:
- `user_buyers` - Buyer profiles with tier (basic/pro/suite)
- `titles` - Content metadata (shared with creator app)
- `user_favorites` - Saved titles (future feature)
- `chat_history` - AI chatbot conversations (future feature)

---

## 🧩 Key Features

### AI Chatbot (Jinu)
- **Location**: `src/pages/buyers/Chat.tsx`
- **Service**: `src/services/chatOrchestratorService.ts`
- **Edge Function**: `supabase/functions/chat-orchestrator/` (deployed separately)
- **Components**: ChatMessage, ChatInput, ChatEmptyState, TitleCard
- **Features**: GPT-4 + vector search, conversation history, suggested queries

### Comps Navigator (NEW)
- **Location**: `src/pages/buyers/CompsNavigator.tsx`
- **Service**: `src/services/compsNavigatorService.ts`
- **Edge Function**: `supabase/functions/comp-navigator/` (shared with dashboard app)
- **Components**: CompSelector, RefinementInput, ResultsGrid, TitleMatchCard, MatchDetailModal, SavedSearchesSidebar
- **Features**: AI-powered hybrid search using 1-3 Hollywood/global comparable titles
  - **Phase 1**: Semantic retrieval via OpenAI embeddings + vector search (2-3 sec)
  - **Phase 2**: GPT-4o-mini re-ranking with match explanations (3-8 sec)
  - **Phase 3**: Search history with bookmarking
- **Database**: Uses `comp_searches` and `comp_title_cache` tables
- **Performance**: 5-10 seconds response time, ~$0.002 per search
- **Route**: `/buyers/comps-navigator`

### Title Discovery
- **Browse**: `src/pages/buyers/Titles.tsx` - Search, filter by genre/format
- **Detail**: `src/pages/buyers/TitleDetail.tsx` - Full metadata with tier-gated pitch
- **Saved**: `src/pages/buyers/Saved.tsx` - Favorites management
- **Service**: `src/services/titlesService.ts` - Complete CRUD operations

### Subscriptions (Stripe)
- **Plan Selection**: `src/pages/buyers/Plan.tsx` - Tier comparison
- **Checkout**: `src/pages/buyers/Checkout.tsx` - Stripe integration
- **Edge Functions**:
  - `create-checkout-session` - Creates Stripe Checkout session
  - `stripe-webhook` - Handles subscription events (tier updates)
- **Guide**: `STRIPE_SETUP_GUIDE.md` - Complete Stripe setup instructions

### Welcome Emails
- **Service**: `src/services/emailService.ts` - Email sending with Resend API
- **Edge Function**: `supabase/functions/send-email/` - Shared email sender
- **Triggers**:
  - Email signup: `src/pages/auth/SignUp.tsx` - After profile creation
  - OAuth signup: `src/pages/auth/CompleteProfile.tsx` - After profile completion
- **Features**:
  - Session-based deduplication (prevents duplicate sends)
  - Non-blocking (email failures don't break signup)
  - Uses `welcome` template with buyer-specific content

### Admin Panel
- **Layout**: `src/components/layout/AdminLayout.tsx` - Sidebar navigation
- **Titles**: `src/pages/admin/AdminTitles.tsx` - Title management table
- **Title Edit Modal**: `src/components/admin/TitleEditModal.tsx` - Full title editing with:
  - Database column names shown in curly braces after each field label (e.g., "Korean Name {title_name_kr}")
  - Collapsible sections: Basic Info, Classification, Metrics, Authors, Content, Story Details, Rights, Achievements
  - Intelligence collection buttons for auto-populating data from platform URLs
  - Analyzer tools: Key Visuals, Fan Signal, Comps Generator, Format Fit

### Comps Generator (Admin Tool)
- **Modal**: `src/components/admin/CompsGeneratorModal.tsx` - AI-powered comparable title generation
- **Manual Search**: `src/components/admin/ManualCompSearch.tsx` - IMDB title search via OMDB API
- **Shared Package**: `@kstorybridge/tools` - Service, types, and autocomplete hook
- **Used In**: WeeklyTitle page, TitleEditModal
- **Features**:
  - AI-generated comps with dimension scoring (narrative, themes, tone, etc.)
  - Manual IMDB search to add titles not suggested by AI
  - Visual differentiation: purple border (AI), teal border (manual)
  - Duplicate prevention by imdbID
  - Combined save of AI + manual comps to `comps_analysis` JSONB
- **Environment**: Requires `VITE_OMDB_API_KEY` for manual search

### GA4 Analytics (Fully Implemented)
- **Measurement ID**: `G-DWL6MV0MC2`
- **Utility**: `src/utils/analytics.ts` (~800 lines, 25+ tracking functions)
- **Initialization**: `src/main.tsx` - Calls `initializeAnalytics()` on app start
- **Documentation**: `docs/tracking/GA4_TRACKING_REFERENCE.md` - Complete event reference

**6 User Funnels Tracked**:
| Funnel | Events |
|--------|--------|
| Authentication | `signup`, `signin` (form_viewed → attempted → completed/error) |
| Title Discovery | `title_search`, `title_detail_view`, `favorite`, `titles_filter_applied` |
| AI Chat | `chat_message` (sent/received), `chat_title_click`, `chat_message_source`, `chat_example_clicked`, `chat_suggestion_click` |
| Comps Navigator | `comps_search`, `comps_result_click`, `comps_example_used` |
| Mandate Matcher | `mandate_search_submitted`, `mandate_example_used`, `mandate_result_click` |
| Checkout | `checkout` (started → completed/cancelled/error) |

**Session-Level Tracking** (fires on page leave):
| Page | Event | Parameters |
|------|-------|------------|
| Chat | `session_searches` | tool: 'chat', search_count |
| Comps Navigator | `session_searches` | tool: 'comps', search_count |
| Mandate Matcher | `session_searches` | tool: 'mandates', search_count |
| Titles | `session_searches` | tool: 'titles', search_count |

**Input Source Tracking** (Chat page):
| Source | Description |
|--------|-------------|
| `typed` | User typed message manually |
| `example` | Clicked example prompt in ChatEmptyState |
| `suggestion` | Clicked suggested follow-up query |
| `url_param` | Message from URL parameter (shared link) |

**Pages with Tracking**:
- `SignUp.tsx`, `SignIn.tsx` - Auth funnel
- `Titles.tsx`, `TitleDetail.tsx` - Discovery funnel with filter tracking
- `Chat.tsx` - Chat funnel with source/session tracking
- `CompsNavigator.tsx` - Comps funnel with example/result/session tracking
- `Mandates.tsx` - Mandate funnel with session tracking
- `Plan.tsx`, `Checkout.tsx`, `CheckoutSuccess.tsx` - Conversion funnel

**Testing**: Set `VITE_AUTH_DEBUG=true` to see `[Analytics]` logs in console

---

## 🎨 Design System

### Colors
- **Primary Text**: `text-black`
- **Neutrals**: `gray-50`, `gray-100`, `gray-200`, `gray-300`, `gray-500`, `gray-900`
- **Tier Colors**: `hanok-teal` (#4C9C9B), `pro-purple` (#AF52DE)
- **Status**: `red-*` (error), `green-*` (success), `blue-*` (info)
- ❌ **NEVER use yellow** (except Suite tier badge gradient)

### Standard Components
```tsx
// Card
<Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
  <CardContent className="p-4 sm:p-6">...</CardContent>
</Card>

// Button
<Button variant="outline" className="border-gray-300 hover:bg-gray-100">
  Button Text
</Button>

// Tier Badge
<ProBadge tier="pro" size="md" />
```

### Typography
- **Font**: SF Pro (system default, no class needed)
- **Headings**: `font-bold text-black`
- **Body**: `text-gray-600` or `text-gray-700`

**Reference Page**: `/buyers/profile` page demonstrates all design standards

---

## 🧪 Testing

### Local Testing
1. Start dev server: `npm run dev`
2. Visit: http://localhost:8081
3. Test auth flows: `/signup`, `/signin`, OAuth
4. Test buyer features: `/buyers/chat`, `/buyers/titles`, `/buyers/profile`
5. Test admin panel: `/admin/titles`

### Build Verification
```bash
npm run build        # Should complete with 0 errors
npm run lint         # Should pass with 0 warnings
npm run preview      # Test production build locally
```

### Test Cards (Stripe Test Mode)
- **Success**: 4242 4242 4242 4242
- **Declined**: 4000 0000 0000 9995
- **Requires Auth**: 4000 0000 0000 0341

---

## 🔧 Environment Setup

### Required Environment Variables (`.env.local`)
```bash
# Supabase (shared project)
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Dashboard URL
VITE_DASHBOARD_URL=http://localhost:8081

# OAuth Testing (Development)
VITE_OAUTH_REDIRECT_URL=http://localhost:8081/auth/callback
VITE_OAUTH_TESTING=true

# Auth Debug Mode (Development)
VITE_AUTH_DEBUG=true

# Stripe (Test Mode)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

### Edge Function Secrets
Set via Supabase CLI:
```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...
npx supabase secrets set STRIPE_PRICE_ID_PRO=price_...
npx supabase secrets set STRIPE_PRICE_ID_SUITE=price_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
npx supabase secrets set DASHBOARD_URL=http://localhost:8081
```

**See**: `STRIPE_SETUP_GUIDE.md` for complete Stripe configuration

---

## 🚨 Critical Rules

### Security
- ❌ **NEVER commit**: `.env.local`, API keys, service role keys
- ✅ **Use**: Vercel for frontend env vars, Supabase CLI for edge function secrets
- ❌ **NEVER use**: Parameters in OAuth callback URL (use URL search params)

### Database
- ✅ **Query pattern**: `.eq('email', user.email?.toLowerCase())`
- ❌ **Never use**: `user_id` field (doesn't exist in user tables)
- ✅ **Always**: Fail clean with clear error messages (no mock data fallback)

### Design
- ❌ **NEVER**: Yellow colors in UI (except Suite tier badge)
- ✅ **Cards**: `bg-transparent border-gray-300 shadow-none rounded-2xl`
- ✅ **Buttons**: `variant="outline" border-gray-300 hover:bg-gray-100`

### Field Naming
- ✅ **Always**: Use snake_case matching database (e.g., `full_name`, `buyer_company`)
- ❌ **Never**: Convert to camelCase in forms (causes submission failures)

---

## 📊 User Flows

### Buyer Signup
1. Visit `/signup` → Enter email/password, company, role
2. All email addresses accepted → Profile created via edge function
3. Welcome email sent (non-blocking)
4. If Supabase returns a session (email confirmation off): auto-login →
   `redirect_after_login` or `/buyers/home?first_run=1` (first-run nudge banner)
5. Email confirmation is ON in the hosted project (`mailer_autoconfirm=false`), so
   step 4 does not happen today: the user sees "Check your email" → `/signin`.
   The verification link opens in a NEW tab (empty sessionStorage), so signup also
   stores the destination in auth user metadata (`redirect_after_login`).
   `/auth/callback` resolves it via `@/lib/postAuthRedirect` (session first, then
   metadata, only `/buyers/*` paths) and clears the metadata copy after use.
   Supabase redirect allowlist (Auth → URL Configuration) must include the app
   origin — production, dashboard-staging (added 2026-09-04) and localhost:8081/8082
   are allowlisted. A non-allowlisted origin falls back to the Site URL
   (creator.kstorybridge.com)
6. Trial users see a "Pick up where you left off" card on `/buyers/home`
   that re-runs their last trial search (comps/mandate/chat)

### Anonymous Visitor → Title Page (shared links)
1. Anonymous visit to `/buyers/titles/:slug` → `ProtectedRoute` stashes the path in
   `sessionStorage.redirect_after_login` and redirects to the in-app public preview
   `/titles/:slug` (never a bare `/signin`)
2. Public preview shows locked sections + "Unlock — Free" CTAs → `/signup` (or `/signin`)
3. After signup/signin, `redirect_after_login` sends the user back to `/buyers/titles/:slug`
   (email signups: via user metadata, since the verification link opens a new tab)
   E2E coverage: `e2e/newsletter-title-journey.e2e.ts` (creates + deletes real
   `@kstorybridge-test.com` accounts via `e2e/helpers/testUsers.ts`; needs
   `SUPABASE_SERVICE_ROLE_KEY` in repo-root `.env.local`; run with `TEST_ENV=local`)
4. Marketing-site links on the public page use `@/lib/websiteUrl` (`WEBSITE_URL`), which
   normalizes `VITE_WEBSITE_URL` (adds `https://` if missing) so a bad env value can't
   produce relative links like `/titles/kstorybridge.com`

### Express Interest (buyer → team)
1. Logged-in buyer clicks "Express Interest" on a title detail page
   (`components/unified-title-detail/ExpressInterestButton.tsx`)
2. Optional note → `express-interest` edge function → `title_interests` row
   (upsert per buyer+title) + Slack + team email (team-mediated; no direct
   creator contact)
3. Button shows "Interest sent" state on revisit (RLS read via `interestService`)
4. GA4: `title_contact_creator_clicked` (open) → `title_interest_submitted` (sent)

### OAuth Signup
1. Click "Sign in with Google" → OAuth consent
2. Callback to `/auth/callback` (context stored in sessionStorage)
3. If new user → `/signup/complete` → Fill profile. This also applies when the user
   started from **Sign In**: a Google-authenticated user with no `user_buyers` row is
   continued into `/signup/complete` ("Almost there" toast), never bounced to `/signup`
   with "Account Not Found" — Google already said yes, a second click looks like a bug
4. Edge function creates profile → Welcome email sent (non-blocking)
5. Redirect to `redirect_after_login` (e.g. a shared title) or `/buyers/home`

### Title Discovery
1. Browse at `/buyers/titles` → Search/filter
2. Click title → `/buyers/titles/:id` → View details
3. Click heart → Save to favorites
4. View saved at `/buyers/saved`

### Tier Upgrade
1. View profile at `/buyers/profile` → Click "Upgrade to Pro"
2. Navigate to `/buyers/plan` → Compare tiers
3. Select tier → `/buyers/checkout` → Stripe Checkout
4. Complete payment → Webhook updates tier
5. Return to app → Pro features unlocked

---

## 🔗 Related Documentation

- **[README.md](./README.md)** - Complete project documentation
- **[PHASES_1-4_COMPLETE.md](./PHASES_1-4_COMPLETE.md)** - Development history
- **[STRIPE_SETUP_GUIDE.md](./STRIPE_SETUP_GUIDE.md)** - Stripe integration guide
- **[Root CLAUDE.md](../../CLAUDE.md)** - Monorepo documentation
- **[Auth Documentation](../../docs/active/AUTH_DOCUMENTATION.md)** - System-wide auth reference
- **[Database Schema](../../docs/active/DATABASE_SCHEMA.md)** - Complete schema

---

## 💡 Development Tips

### Why This Dashboard Exists
The previous dashboard (now archived as `dashboard-legacy`) had 279 files with mixed buyer/creator logic, complex fallbacks, and tight coupling. This is a clean rebuild with 82% fewer files (~50 total), buyer-only focus, and simpler patterns.

### Shared Supabase Database
All apps (dashboard, creator, website) share the same Supabase project. This means:
- Database migrations affect all apps
- Edge functions are shared
- No data migration needed between apps

### File Count Philosophy
This app intentionally minimizes files by:
- Colocating related components
- Using services for shared logic
- Avoiding premature abstraction
- Keeping auth code in one place (~350 lines in `auth.ts`)

### When to Add New Files
Only create new files when:
- A component is reused in 3+ places
- A utility is shared across multiple features
- A service encapsulates complex external logic (like Stripe)
- Avoid creating files "just in case"

---

## 🐛 Common Issues

### OAuth Hangs or Times Out
- **Issue**: OAuth signup hangs in production
- **Solution**: Edge function architecture (100% success rate)
- **See**: `AUTH_DOCUMENTATION.md` - "OAuth signup hangs" section

### Tier Not Updating After Payment
- **Issue**: Stripe webhook fired but tier unchanged
- **Check**:
  1. Webhook endpoint URL is correct
  2. Webhook secret is set in edge function
  3. View edge function logs: `npx supabase functions logs stripe-webhook`
  4. Verify RLS policies allow service role to update

### Build Fails with Type Errors
- **Issue**: TypeScript errors in strict mode
- **Solution**: Fix type errors (no `any` types allowed)
- **Run**: `npm run build` to see all errors at once

---

**Last Updated**: 2026-01-11
**Version**: 2.0
**Status**: ✅ Production Ready - Primary Buyer Dashboard
