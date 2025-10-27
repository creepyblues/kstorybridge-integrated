# Dashboard App V2 - Product Requirements Document

**Version**: 2.0
**Status**: Planning Phase
**Created**: 2025-10-25
**Last Updated**: 2025-10-25
**Target Production URL**: https://dashboard-v2.kstorybridge.com (TBD)

---

## Executive Summary

Dashboard App V2 is a complete rebuild of the buyer-focused platform, designed specifically for media buyers and administrators to discover Korean content via AI chatbot, manage subscriptions, and browse the title catalog. This rebuild eliminates creator dependencies, simplifies authentication, and establishes a clean, maintainable architecture following the successful creator-v2 pattern.

### Goals
1. **Clean Separation**: Remove all creator routes and dependencies (moved to creator-v2 app)
2. **Simple & Robust**: No complex fallback logic - fail clean and ask users to retry
3. **Isolated Auth**: Buyer-only authentication flows (email + OAuth)
4. **Consistent UX**: Standard design system across all buyer pages
5. **Maintainable**: <150 files vs current 279 files (46% reduction)

---

## Core Features

### 1. Authentication (Buyer-Only)
**Priority**: P0 (Critical)

#### Email/Password Authentication
- Sign up with work email (personal emails blocked)
- Sign in with email and password
- Password reset flow
- Email verification
- Default tier: `basic`

#### Google OAuth Authentication
- Sign up with Google (work email validation)
- Sign in with Google
- Profile completion after OAuth signup
- Account type='buyer' set DURING signup (not after)

#### Requirements
- **CRITICAL**: No creator auth pages (moved to creator-v2)
- Single auth listener (no race conditions)
- Simple error messages
- Session persists across page reloads
- Automatic token refresh
- Work email validation for buyers

#### Email Domain Validation
```typescript
const consumerEmailProviders = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'aol.com', 'icloud.com', 'protonmail.com', 'mail.com'
];
// Block personal emails - buyers must use work email
```

---

### 2. AI Chatbot ("Jinu")
**Priority**: P0 (Critical)

#### Features
- Conversational title discovery using GPT-4
- Vector search with 10 results per query
- Intent classification (5 types)
- Pitch analytics integration (Phase 3)
- Contextual response generation (Phase 4)
- Anti-hallucination validation
- Fuzzy title matching
- Chat history persistence
- Suggested follow-up queries

#### Implementation Status (from current dashboard)
- ✅ Phase 1: Quick Wins (vector search, anti-hallucination, fuzzy matching)
- ✅ Phase 2: Prompt Engineering (intent, context weighting, fallback search)
- ✅ Phase 3: Pitch Analytics Integration (60+ query types)
- ✅ Phase 4: Contextual Response Generation (50% token reduction)

#### Edge Function
- **Name**: `chat-orchestrator`
- **Status**: Production-ready (to be migrated)
- **Performance**: 3-5 second responses
- **Cost**: ~$0.015-0.018 per query

#### User Experience
- Primary buyer landing page (`/buyers/chat`)
- Empty state with suggested queries
- Message bubbles (user vs bot)
- Title cards within responses (clickable)
- Feedback system (thumbs up/down)
- "View Pitch" buttons for titles with pitch decks
- New chat button

---

### 3. Tier System & Subscriptions
**Priority**: P0 (Critical)

#### Tier Levels
```typescript
const tierHierarchy = {
  basic: 1,    // Default - standard features
  invited: 0,  // Restricted (legacy, admin-assigned)
  pro: 2,      // Premium content access
  suite: 3     // Full feature access
};
```

#### Tier-Based Access
- **Basic**: AI chatbot, browse titles, view basic info
- **Pro**: View pitch decks, advanced search, premium content
- **Suite**: All features, priority support, advanced analytics

#### Stripe Integration
- Checkout session creation (`/buyers/plan` → Stripe hosted checkout)
- Subscription webhook handling (payment success, cancellation)
- Billing portal access (`/buyers/plan` → manage subscription)
- Automatic tier sync with Stripe subscriptions
- Payment success/cancel redirects

#### Edge Functions (Stripe)
- `create-checkout-session` - Create Stripe checkout
- `stripe-webhook` - Handle subscription events
- `cancel-subscription` - Process cancellations
- `create-billing-portal` - Generate billing portal link

---

### 4. Title Discovery & Browsing
**Priority**: P0 (Critical)

#### Title List (`/buyers/titles`)
- Grid view with title cards
- Search by title name (English/Korean)
- Filter by genre, format, tags
- Sort by title, views, rating
- "Pitch Available" filter (pro/suite only)
- Pagination (50 items per page)
- Lazy loading for performance

#### Title Detail (`/buyers/titles/:id`)
- Comprehensive title information
- Cover image display
- Synopsis, description, tagline
- Author information (story/art)
- Genre, tone, audience
- Market positioning (perfect_for, comps)
- View/like/rating metrics
- **Tier-gated**: Pitch deck viewer (pro/suite)
- **Tier-gated**: Full analytics (suite)
- Related titles suggestions

#### Favorites (`/buyers/saved`)
- View favorited titles
- Remove from favorites
- Search within favorites
- Export favorites list (suite)

---

### 5. Profile Management
**Priority**: P0 (Critical)

#### Buyer Profile (`/buyers/profile`)
- Display fields:
  - Full name
  - Email
  - Company
  - Role (producer, executive, agent, content scout, other)
  - LinkedIn URL
  - Current tier
  - Account creation date
  - Subscription status

- Editable fields:
  - Full name
  - Company
  - Role
  - LinkedIn URL

- Account actions:
  - Sign out
  - Manage subscription (if pro/suite)
  - Request tier upgrade (if basic)
  - Delete account (future)

---

### 6. Admin Features
**Priority**: P1 (High - Admin Only)

#### Admin Access Control
**Admin Emails** (hardcoded whitelist):
- `sungho@dadble.com`
- `kevin@sandstoneartists.com`

**Admin Routes** (accessible via `/experiment` gateway):
- `/admin/titles` - Title management
- `/admin/titles/add` - Add new title
- `/admin/titles/:id/edit` - Edit title
- `/admin/user-approval` - Approve creator accounts
- `/admin/featured` - Manage featured titles
- `/admin/pitch-extraction-test` - Test pitch extraction

#### Title Management (Admin)
- Add titles with all fields (30+ fields)
- Edit existing titles
- Upload cover images
- Upload pitch deck PDFs
- Trigger pitch extraction
- Delete titles
- Feature/unfeature titles

#### User Approval (Admin)
- View pending creator accounts
- Approve/reject creator applications
- Change user tiers (buyers)
- View user activity

#### Featured Titles (Admin)
- Add titles to featured carousel
- Set featured order
- Remove from featured

#### Pitch Extraction Testing (Admin)
- Upload pitch deck PDF
- Trigger GPT-4o extraction
- View extracted data (50+ fields)
- Save to database
- Cost monitoring (~$0.15-0.20 per deck)

---

## Technical Requirements

### Frontend Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query + React Context
- **Forms**: React Hook Form + Zod

### Backend / Database
- **Backend**: Supabase (shared project with creator-v2)
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage (titles, pitch_decks buckets)
- **Edge Functions**: Supabase Functions
- **Auth**: Supabase Auth

### Key Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@supabase/supabase-js": "^2.39.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@radix-ui/react-*": "latest",
    "tailwindcss": "^3.3.0",
    "stripe": "^14.0.0",
    "openai": "^4.20.0"
  }
}
```

---

## Database Schema

### Tables Used

#### `user_buyers`
```sql
CREATE TABLE user_buyers (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  buyer_company TEXT,
  buyer_role TEXT CHECK (buyer_role IN ('producer','executive','agent','content_scout','other')),
  linkedin_url TEXT,
  tier user_tier DEFAULT 'basic' CHECK (tier IN ('basic','invited','pro','suite')),
  requested BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `admin`
```sql
CREATE TABLE admin (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `titles`
Main table for content catalog (shared with creator-v2). Fields include:
- Basic: title_id, title_name_kr, title_name_en, description, synopsis, tagline
- Authors: author, story_author, art_author, writer, illustrator
- Content: genre, content_format, chapters, completed, tags
- Media: title_image, title_url, pitch (PDF URL)
- Metrics: views, likes, rating, rating_count
- Market: perfect_for, comps (array), tone, audience
- Business: rights, rights_owner
- Ownership: creator_id (FK to user_creators.id)
- Timestamps: created_at, updated_at

#### `user_favorites`
```sql
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title_id UUID REFERENCES titles(title_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, title_id)
);
```

#### `chat_history`
Chat session and message storage (schema from current dashboard)

#### `title_content_analysis`
Pitch deck extraction results (JSONB field: pitch_analysis)

#### `subscriptions` (Stripe)
Subscription tracking linked to user_buyers

---

## Edge Functions Used

### Buyer-Specific Functions
1. **create-buyer-profile** - Creates buyer profile during signup
2. **chat-orchestrator** - AI chatbot with vector search (Phases 1-4)
3. **send-email** - Transactional emails

### Stripe Functions
4. **create-checkout-session** - Stripe checkout for subscriptions
5. **stripe-webhook** - Handle Stripe events (payment, cancellation)
6. **cancel-subscription** - Cancel active subscription
7. **create-billing-portal** - Generate billing portal link

### Admin Functions
8. **extract-pitch-test** - GPT-4o pitch deck extraction

### Shared Functions (OK to use)
- Edge functions are shared across apps via Supabase
- No code duplication needed

---

## Storage Buckets Used

### `titles`
- **Purpose**: Store title cover images
- **Access**: Public read, authenticated write (RLS)
- **File types**: Images (PNG, JPG, WebP)
- **Path pattern**: `{creator_id}/{title_id}/cover.{ext}`

### `pitch_decks`
- **Purpose**: Store pitch deck PDFs
- **Access**: Authenticated only, tier-gated (pro/suite)
- **File types**: PDF only
- **Path pattern**: `{creator_id}/{title_id}/pitch.pdf`

---

## Authentication Flow

### Email Signup Flow (Buyer)
1. User fills signup form (email, password, company, role)
2. **Email validation**: Block personal email domains
3. Call `supabase.auth.signUp()` with metadata:
   ```typescript
   await supabase.auth.signUp({
     email,
     password,
     options: {
       data: {
         account_type: 'buyer',  // ✅ Set during signup
         full_name
       }
     }
   })
   ```
4. Call edge function: `/create-buyer-profile` (server-side)
5. Send verification email
6. User verifies email
7. User signs in → `/buyers/chat`

### OAuth Signup Flow (Buyer)
1. User clicks "Sign up with Google"
2. Store context: `sessionStorage.setItem('oauth_flow', 'signup')`
3. Store context: `sessionStorage.setItem('oauth_account_type', 'buyer')`
4. Redirect to Google OAuth with callback URL: `${origin}/auth/callback?account_type=buyer&flow=signup`
5. Google redirects back with code
6. Exchange code for session
7. Redirect to `/signup/buyer?complete=true&user_id=${id}&email=${email}`
8. User fills profile form (company, role, LinkedIn)
9. Call edge function: `/create-buyer-profile`
10. Set metadata via `updateUser()` (single call)
11. Redirect to `/buyers/chat`

### Email Signin Flow (Buyer)
1. User fills signin form (email, password)
2. Call `supabase.auth.signInWithPassword()`
3. Check profile exists in `user_buyers`
4. If no profile → Error "Account not found. Please sign up first."
5. If profile exists → Redirect to `/buyers/chat`

### OAuth Signin Flow (Buyer)
1. User clicks "Sign in with Google"
2. Store context: `sessionStorage.setItem('oauth_flow', 'signin')`
3. Store context: `sessionStorage.setItem('oauth_account_type', 'buyer')`
4. Redirect to Google OAuth with callback URL: `${origin}/auth/callback?account_type=buyer&flow=signin`
5. Google redirects back with code
6. Exchange code for session
7. Check profile exists in `user_buyers`
8. If no profile → Error "Account not found. Please sign up first."
9. If profile exists → Redirect to `/buyers/chat`

### Admin Detection
1. User signs in (email or OAuth)
2. Check if email in admin whitelist
3. If admin → Additional admin routes available via `/experiment`
4. If buyer → Standard buyer routes only

---

## UI/UX Requirements

### Design System
- **Font**: SF Pro (system default)
- **Primary Color**: Hanok Teal (#4C9C9B)
- **Pro Tier Color**: Purple (#AF52DE)
- **Card Style**: Transparent background, gray-300 border, rounded-2xl, no shadow
- **Button Style**: Outline variant, gray-300 border, light gray hover
- **Typography**: Black text for primary content, gray for secondary
- **NO YELLOW COLORS**: Prohibited per design policy

### Standard Components (Create in V2)
- `StandardButton` - Consistent button styling
- `StandardCard` - Consistent card styling
- `ProBadge` - Tier indicator badge
- `PremiumColumn` - Tier-gated content wrapper
- `ChatEmptyState` - Chatbot empty state
- `TitleCard` - Title display card
- `FeaturedTitlesCarousel` - Featured content carousel

### shadcn/ui Components to Use
- Button, Input, Card, Textarea
- DropdownMenu, Select
- Dialog, Sheet
- Tabs
- Toast (from local hook, NOT shared package)

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Sidebar collapses on mobile
- Touch-friendly on mobile

### Tier-Based UI Elements
```tsx
// Pro badge display
<ProBadge tier={tier} />

// Tier-gated content
<OptimizedTierGatedContent requiredTier="pro">
  <PitchViewer url={pitchUrl} />
</OptimizedTierGatedContent>

// Upgrade prompt
<ChatUpgradePrompt
  currentTier={tier}
  requiredTier="pro"
  feature="View Pitch Decks"
/>
```

---

## Security Requirements

### Authentication
- Passwords must be hashed (handled by Supabase)
- JWT tokens for session management
- Automatic token refresh
- Secure session storage
- Work email validation for buyers

### Authorization
- Row Level Security (RLS) on all tables
- Buyers can only:
  - View/edit their own profile
  - View public titles
  - Favorite/unfavorite titles
  - Access chat history (their own)
  - Access features based on tier
- Admins can:
  - Manage all titles
  - Approve users
  - Access admin routes

### Data Protection
- All API calls use authenticated requests
- No sensitive data in localStorage (use sessionStorage)
- HTTPS only in production
- Stripe keys stored in Supabase secrets
- OpenAI keys stored in edge function secrets

### Tier-Based Access Control
```typescript
// Example: Pitch deck access (pro/suite only)
if (tier === 'basic' || tier === 'invited') {
  return <UpgradePrompt requiredTier="pro" />;
}
return <PitchViewer url={pitchUrl} />;
```

---

## Performance Requirements

- **Page load time**: < 3 seconds
- **Time to interactive**: < 5 seconds
- **Chatbot response**: 3-5 seconds
- **Auth operations**: < 30 seconds
- **Image optimization**: WebP format, lazy loading
- **Code splitting**: Lazy load routes
- **Database queries**: <100ms for title lists
- **Vector search**: <2 seconds

### Performance Optimizations (Carry Over from V1)
- TierProvider context (eliminates 99% of tier queries)
- Session-based caching (1-hour expiry)
- Lazy loading for title images
- Pagination for title lists (50 items)
- Debounced search inputs
- React Query for server state

---

## Testing Requirements

### Unit Tests
- Auth service functions
- Form validation
- Tier access logic
- Search utilities

### Integration Tests
- Complete signup flow (email + OAuth)
- Complete signin flow (email + OAuth)
- Chatbot query → response → title click
- Tier upgrade → Stripe checkout → webhook
- Profile updates
- Favorites add/remove

### E2E Tests
- **Happy path**: Signup → Chat → Browse Titles → View Detail → Favorite
- **Tier upgrade**: Basic → Subscribe → Pro access unlocked
- **Admin flow**: Signin → Add Title → Feature Title → Approve User
- **Error cases**: Network errors, validation errors, OAuth failures

### Edge Cases to Test
- User exists in auth.users but no profile in user_buyers (show error)
- OAuth signin with personal email (block with error)
- Session timeout during chatbot conversation
- Stripe webhook failure handling
- Pitch deck extraction timeout

---

## Deployment Requirements

### Environments
- **Development**: http://localhost:8085 (new port to avoid conflicts)
- **Production**: https://dashboard-v2.kstorybridge.com (TBD - may replace current dashboard)

### Build Configuration
- Vite production build
- Environment variables via Vercel
- Source maps disabled in production
- Tree-shaking enabled

### Required Environment Variables
```bash
# Supabase
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)

# OAuth (Vercel deployment only, not localhost)
VITE_OAUTH_REDIRECT_URL=https://dashboard-v2.kstorybridge.com/auth/callback
```

### OAuth Configuration
**Google OAuth Console**:
- Authorized redirect URIs:
  - http://localhost:8085/auth/callback (development)
  - https://dashboard-v2.kstorybridge.com/auth/callback (production)

**Supabase Auth Settings**:
- Site URL: https://dashboard-v2.kstorybridge.com
- Redirect URLs: Same as above

### Edge Function Secrets (Supabase)
```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenAI
OPENAI_API_KEY=sk-...

# Email
SENDGRID_API_KEY=SG...
```

---

## Success Metrics

### Authentication
- Email signup success rate: > 95%
- OAuth signup success rate: > 95%
- Signup completion time: < 2 minutes
- Zero OAuth timeout errors
- Session persistence: > 99%

### User Engagement
- Chatbot usage rate: Track % of buyers who use chat
- Average queries per session: Target > 5
- Title discovery rate: Track % who view titles from chat
- Favorite rate: Track % who favorite titles
- Upgrade conversion: Track basic → pro/suite conversion rate

### Performance
- Average page load time: < 3 seconds
- 95th percentile page load time: < 5 seconds
- Chatbot response time: 3-5 seconds average
- Error rate: < 1%

### Business Metrics
- Pro tier conversion rate: Track basic → pro
- Suite tier conversion rate: Track pro → suite
- Subscription retention: Monthly churn rate
- Pitch deck views: Track pro/suite engagement

---

## Future Enhancements (Out of Scope for V2)

- [ ] Real-time notifications (title updates, new content)
- [ ] Direct messaging with creators
- [ ] Advanced analytics dashboard (usage patterns, trends)
- [ ] Bulk title export (Excel/CSV)
- [ ] Saved searches
- [ ] Email alerts for new titles matching criteria
- [ ] Mobile apps (iOS/Android)
- [ ] Integration with external databases (IMDb, Wikipedia)
- [ ] Collaborative features (team accounts, shared favorites)

---

## Migration from V1

### What to Keep
- All buyer data (no migration needed - same database)
- All title data (no migration needed - same table)
- AI chatbot implementation (chat-orchestrator edge function)
- Stripe integration (edge functions + webhook)
- Tier system logic
- Edge functions (shared via Supabase)

### What to Rewrite
- Authentication system (buyer-only, simplified)
- Auth context/hooks (no creator logic)
- OAuth callback handler (buyer-only)
- Page layouts (remove creator routes)
- Navigation (buyer-focused sidebar)

### What to Remove
- All creator-related code (moved to creator-v2)
- Creator auth pages (moved to creator-v2)
- Complex session health checks
- Multiple auth listeners
- Shared auth abstractions with creators
- Mock data fallbacks (fail clean instead)

### Data Migration
**NOT REQUIRED** - Dashboard V2 uses the same Supabase database:
- `user_buyers` table stays unchanged
- `titles` table stays unchanged (shared with creator-v2)
- `chat_history` table stays unchanged
- `subscriptions` table stays unchanged

---

## Dependencies on Other Systems

### Supabase
- **Database**: Shared with creator-v2 app (same project)
- **Auth**: Shared auth system (buyer vs creator via account_type)
- **Storage**: Shared storage buckets
- **Edge Functions**: Shared functions (chat, email, etc.)

### External Services
- **Google OAuth**: For social login
- **Stripe**: For subscription management
- **OpenAI**: For chatbot (GPT-4) and pitch extraction (GPT-4o)
- **Vercel**: For deployment and hosting

### Creator V2 App
- **No direct dependencies**: Completely isolated apps
- **Shared database**: Same Supabase project
- **Shared edge functions**: Supabase functions work for both apps
- **Separate auth flows**: No shared auth code

---

## Critical Rules & Principles

### Authentication Rules
1. ❌ **NEVER auto-create profiles** - Show error if profile missing
2. ❌ **NEVER use OAuth state parameter** - Use URL query params in redirectTo
3. ✅ **Profile existence = valid account** - auth.users alone is not enough
4. ✅ **account_type='buyer' during signup** - Not after signup
5. ✅ **Single auth listener** - No competing listeners
6. ✅ **Sequential operations** - No concurrent auth calls

### Error Handling Rules
1. ❌ **NO fallback to mock data** - Show error to user
2. ❌ **NO default account type assignment** - Explicit validation required
3. ✅ **Fail clean with clear error** - "Please try again"
4. ✅ **Show errors to users** - No silent failures
5. ✅ **Simple retry mechanism** - No complex recovery logic

### Database Rules
1. ✅ **Query by email** - `.eq('email', user.email)`
2. ❌ **NEVER query by user_id** - Field doesn't exist in user tables
3. ✅ **RLS policies** - All tables must have RLS enabled
4. ✅ **Edge functions for signup** - Bypass RLS with service role

### Design Rules
1. ❌ **NEVER use yellow colors** - Prohibited
2. ✅ **Cards**: `bg-transparent border-gray-300 shadow-none rounded-2xl`
3. ✅ **Buttons**: `variant="outline" border-gray-300 hover:bg-gray-100`
4. ✅ **Font**: SF Pro (automatic, no class needed)
5. ✅ **Tier badges**: Pro = purple (#AF52DE)

### Code Quality Rules
1. ✅ **Simple abstractions** - Easy to understand
2. ✅ **No over-engineering** - Build only what's needed
3. ✅ **Consistent patterns** - Follow creator-v2 approach
4. ✅ **Clear errors** - Helpful messages for users
5. ✅ **Clean codebase** - Target <150 files

---

## File Structure

```
apps/dashboard-v2/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── index.html
├── public/
│   └── docs/ (documentation files for /docs routes)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── SignIn.tsx (buyer signin)
│   │   │   ├── SignUp.tsx (buyer signup)
│   │   │   ├── CompleteProfile.tsx (OAuth completion)
│   │   │   ├── ForgotPassword.tsx
│   │   │   └── AuthCallback.tsx
│   │   ├── buyers/
│   │   │   ├── Chat.tsx (primary landing page)
│   │   │   ├── Titles.tsx (browse titles)
│   │   │   ├── TitleDetail.tsx (title detail view)
│   │   │   ├── Saved.tsx (favorites)
│   │   │   ├── Profile.tsx (buyer profile)
│   │   │   ├── Plan.tsx (subscription management)
│   │   │   └── Settings.tsx (account settings)
│   │   ├── admin/
│   │   │   ├── Titles.tsx (title management)
│   │   │   ├── AddTitle.tsx (add title)
│   │   │   ├── EditTitle.tsx (edit title)
│   │   │   ├── UserApproval.tsx (approve creators)
│   │   │   ├── Featured.tsx (manage featured)
│   │   │   └── PitchExtractionTest.tsx (test pitch extraction)
│   │   ├── Experiment.tsx (admin gateway)
│   │   ├── PaymentSuccess.tsx (Stripe redirect)
│   │   ├── PaymentCancel.tsx (Stripe redirect)
│   │   └── NotFound.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── BuyerLayout.tsx (buyer sidebar + header)
│   │   │   ├── AdminLayout.tsx (admin sidebar + header)
│   │   │   └── PageContainer.tsx (page wrapper)
│   │   ├── ui/ (shadcn components)
│   │   ├── chat/
│   │   │   ├── ChatEmptyState.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── TitleCard.tsx
│   │   ├── tier/
│   │   │   ├── ProBadge.tsx
│   │   │   ├── TierGatedContent.tsx
│   │   │   └── UpgradePrompt.tsx
│   │   ├── StandardButton.tsx
│   │   ├── StandardCard.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── ErrorBoundary.tsx
│   ├── lib/
│   │   ├── supabase.ts (Supabase client)
│   │   ├── auth.ts (Auth service)
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useAuth.tsx (Auth context)
│   │   ├── useTierAccess.tsx (Tier context)
│   │   └── use-toast.tsx
│   ├── services/
│   │   ├── titlesService.ts
│   │   ├── chatOrchestratorService.ts
│   │   ├── stripeService.ts
│   │   ├── favoritesService.ts
│   │   └── emailService.ts
│   ├── contexts/
│   │   ├── TierContext.tsx
│   │   └── DataCacheContext.tsx
│   └── utils/
│       ├── analytics.ts
│       ├── searchUtils.ts
│       └── validation.ts
```

---

## Open Questions

- [ ] Should we migrate existing buyer accounts or require re-signup?
  - **Decision Needed**: No migration needed - same database, just new UI

- [ ] Do we need email verification for email signups?
  - **Decision Needed**: Yes, use Supabase's built-in email verification

- [ ] Should we add rate limiting for chatbot queries?
  - **Decision Needed**: Defer to Phase 2 if needed (monitor usage first)

- [ ] What's the migration timeline from V1 to V2?
  - **Decision Needed**: Deploy V2 to new subdomain first, test, then switch DNS

- [ ] Should we support additional OAuth providers (Discord, Microsoft)?
  - **Decision Needed**: Start with Google only, add others based on demand

---

## Appendix

### References
- [Creator App V2 PRD](./CREATOR_APP_V2_PRD.md) - Reference for successful patterns
- [Creator App V2 Rebuild Plan](./CREATOR_APP_V2_REBUILD_PLAN.md) - Phase-by-phase approach
- [Auth Documentation](./active/AUTH_DOCUMENTATION.md) - Complete auth reference
- [Chatbot Overview](./features/chatbot/OVERVIEW.md) - AI chatbot system (Phases 1-4)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [React Router Documentation](https://reactrouter.com/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Stripe Documentation](https://stripe.com/docs)

### Key Differences from Creator V2
| Aspect | Creator V2 | Dashboard V2 |
|--------|-----------|--------------|
| **Primary Users** | Creators (authors, agents) | Buyers (producers, executives) |
| **Auth Validation** | Any email allowed | Work email required |
| **Main Feature** | Title management (CRUD) | AI chatbot (title discovery) |
| **Tier System** | Basic (all creators) | Basic/Pro/Suite (subscription) |
| **Monetization** | None | Stripe subscriptions |
| **Admin Features** | None | Full admin panel |
| **Profile Fields** | Pen name, role, company | Company, role, LinkedIn |
| **Default Landing** | /home (title list) | /buyers/chat (chatbot) |
| **Port** | 8084 | 8085 |

---

**Document Status**: ✅ Complete - Ready for Review
**Current Phase**: Planning
**Next Phase**: Directory Setup & Configuration (Phase 1)

---

## Deployment Status (TBD)

### Production Deployment
- **Production URL**: TBD (https://dashboard-v2.kstorybridge.com)
- **Deployment Date**: TBD
- **Deployment Method**: Vercel CLI (`vercel --prod`)

### Configuration
- [ ] OAuth callbacks configured (Google Console + Supabase)
- [ ] Custom domain DNS configured
- [ ] Environment variables set
- [ ] Stripe webhook endpoint configured
- [ ] Security headers enabled
- [ ] HTTPS/SSL certificate active

### Testing
- [ ] Infrastructure tests (build, bundles, security)
- [ ] P0 feature tests (auth, chatbot, tier system)
- [ ] Stripe integration tests (checkout, webhook)
- [ ] Admin feature tests (title management)

---

## Code Review & Testing

**Code Review**: TBD
**Production Testing**: TBD
**Overall Grade**: TBD

---

**Last Updated**: 2025-10-25
**Author**: Claude Code
**Approved By**: TBD
