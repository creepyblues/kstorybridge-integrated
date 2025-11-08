# Dashboard App V2

**Status**: Phase 5 Complete - Production Ready ✅
**Port**: 8086 (development)
**Target Production URL**: https://dashboard-v2.kstorybridge.com (TBD)

Clean rebuild of the buyer-focused dashboard with AI chatbot, tier system, title discovery, Stripe integration, and admin panel.

---

## 🎯 Project Status

### ✅ Phase 1 Complete: Auth System
- **Authentication System** - Buyer-only email + OAuth signup/signin
- **Auth Pages** - SignIn, SignUp, AuthCallback, CompleteProfile
- **Base Components** - shadcn/ui components (Button, Input, Card, Toast)
- **Routing** - React Router v6 with protected routes

### ✅ Phase 2 Complete: Core Buyer Features
- **AI Chatbot (Jinu)** - Full chat UI with chat-orchestrator edge function
- **Tier System** - Context-based tier access control (basic/pro/suite)
- **Tier Components** - ProBadge, TierGatedContent
- **Chat Components** - ChatMessage, ChatInput, ChatEmptyState, TitleCard
- **Titles Service** - Complete CRUD service for titles and favorites

### ✅ Phase 3 Complete: Title Discovery & Profile
- **Titles Browse Page** - Search, filter by genre/format, grid view
- **Title Detail Page** - Full metadata with tier-gated pitch access
- **Saved Page** - Favorites management with add/remove
- **Profile Page** - Buyer profile with tier display and benefits

### ✅ Phase 4 Complete: Subscriptions & Admin Foundation
- **Plan Selection** - Tier comparison page with pricing (Basic/Pro/Suite)
- **Checkout Flow** - Stripe integration placeholder with demo flow
- **Payment Pages** - Success/cancel confirmation pages
- **Admin Layout** - Sidebar navigation with protected admin routes
- **Admin Titles** - Title management table with search and stats

### ✅ Phase 5 Complete: Production Readiness
- **Stripe Integration** - Real checkout session edge function
- **Webhook Handler** - Subscription event processing and tier updates
- **Admin Edit** - Title edit modal with form validation
- **Admin Delete** - Title deletion with confirmation dialog
- **Build Optimization** - 427KB production bundle (gzipped: 121KB)

### 📋 Future Enhancements
- User management and approval workflow
- Billing portal integration
- Featured titles carousel
- Title create form (admin)
- Analytics dashboard

---

## 🚀 Quick Start

### Development
```bash
# From project root
npm install
npm run dev:dashboard-v2

# Or from this directory
npm install
npm run dev
```

Server runs on **http://localhost:8085**

### Build
```bash
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build
```

---

## 🔑 Key Features (Implemented)

### Authentication ✅
- **Email Signup/Signin** - Work email validation, profile creation via edge function
- **Google OAuth** - Signup/signin with profile completion
- **Profile Completion** - For OAuth users
- **Session Persistence** - Automatic token refresh
- **account_type='buyer'** - Set during signup (not after)

**Implementation**:
- Single auth listener (no competing listeners)
- Sequential operations (no race conditions)
- Work email validation (blocks personal domains)
- Clean error messages for users
- ~350 lines of auth code total

### AI Chatbot (Jinu) ✅
- **Chat Interface** - Message bubbles with user/bot avatars
- **Empty State** - Welcome message with 5 suggested queries
- **Title Cards** - Display up to 6 titles with metadata
- **Conversation History** - Context-aware responses
- **Edge Function** - chat-orchestrator with GPT-4 + vector search

**Components**:
- `chatOrchestratorService.ts` - Service wrapper for edge function
- `Chat.tsx` - Main chat page with message management
- `ChatMessage.tsx` - Message bubble component
- `ChatInput.tsx` - Input with auto-resize
- `ChatEmptyState.tsx` - Welcome screen
- `TitleCard.tsx` - Title result cards

### Tier System ✅
- **Tier Hierarchy** - invited(0) < basic(1) < pro(2) < suite(3)
- **Context Provider** - TierProvider wraps entire app
- **Access Control** - `hasAccess(requiredTier)` hook
- **Tier Components** - ProBadge, TierGatedContent

**Implementation**:
- Single database query on mount (cached in context)
- `TierGatedContent` wrapper for premium features
- Upgrade prompts with Lock icon and pro-purple styling
- Automatic tier display in UI

### Titles Service ✅
- **CRUD Operations** - getTitles, getTitleById, getFavorites
- **Filtering** - By genre, format, search query, rating, completion
- **Favorites** - Add/remove/check favorite status
- **Metadata** - getGenres, getFormats for filters
- **Helper Functions** - formatNumber for display (1.2M, 500K)

### Title Discovery Pages ✅
- **Titles.tsx** - Browse page with search, genre/format filters, grid layout
- **TitleDetail.tsx** - Full title view with stats, description, synopsis, tier-gated pitch deck
- **Saved.tsx** - Favorites management with remove functionality
- **Profile.tsx** - Buyer profile with tier display, benefits list, account info

**Features**:
- Search titles by name or description
- Filter by genre and content format
- Active filter badges with clear all
- Responsive grid layout (1/2/3 columns)
- Click to view details or navigate
- Tier-gated pitch deck access (Pro/Suite only)
- Favorite/unfavorite titles
- Profile tier benefits visualization

### Subscription & Admin Pages ✅
- **Plan.tsx** - Tier comparison with pricing cards (Basic/Pro/Suite)
- **Checkout.tsx** - Stripe checkout placeholder with implementation guide
- **CheckoutSuccess.tsx** - Payment success confirmation
- **CheckoutCancel.tsx** - Checkout cancellation page
- **AdminLayout.tsx** - Sidebar navigation for admin panel
- **AdminTitles.tsx** - Title management table with search and stats

**Features**:
- Tier comparison with feature lists
- Popular plan badge (Pro tier)
- Current plan indicator
- Upgrade/downgrade CTAs
- Demo checkout flow
- Admin sidebar navigation
- Title table with sorting/filtering
- Stats dashboard (total, with pitch, completed, ongoing)

---

## 🗄️ Database

### Tables Used
- **user_buyers** - Buyer profiles with tier system
- **titles** - Title metadata (shared with creator-v2)
- **user_favorites** - Favorited titles (future)
- **chat_history** - AI chatbot conversations (future)

### Services
- `authService` - Authentication operations (src/lib/auth.ts)
- `chatOrchestratorService` - AI chatbot wrapper (src/services/chatOrchestratorService.ts)
- `titlesService` - Title CRUD operations (src/services/titlesService.ts)
- Edge functions shared with creator-v2 via Supabase

---

## 🎨 Design System

### UI Framework
- **shadcn/ui** - Component library
- **Tailwind CSS** - Utility-first CSS
- **Radix UI** - Headless UI primitives

### Design Standards
```tsx
// Card
<Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">

// Button
<Button variant="outline" className="border-gray-300 hover:bg-gray-100">

// Colors
- Primary: black
- Neutrals: gray-50, gray-100, gray-200, gray-300
- Pro tier: purple (#AF52DE)
- ❌ NO YELLOW COLORS
```

### Typography
- **Font**: SF Pro (system default, no class needed)
- **Headings**: font-bold, text-black
- **Body**: text-gray-600, text-gray-700

---

## 🔧 Configuration

### Environment Variables (.env.local)
```bash
# Supabase
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...

# OAuth Callbacks (Development)
# http://localhost:8085/auth/callback

# Debug Mode (Development Only)
VITE_AUTH_DEBUG=true
```

### Supabase Project
- **Project ID**: dlrnrgcoguxlkkcitlpd
- **Shared**: Yes (with creator-v2 app)
- **Region**: US East (Ohio)

---

## 🧪 Testing

### Manual Testing Checklist (Phase 1)
- [x] Email Signup - Create account, verify email required
- [x] Email Signin - Existing account signin
- [x] OAuth Signup - Google signup, profile completion
- [x] OAuth Signin - Existing Google user
- [x] Work Email Validation - Block personal emails (Gmail, Yahoo, etc.)
- [x] Profile Existence Check - Show error if no profile
- [x] Session Persistence - Reload page, session stays
- [x] Protected Routes - Unauthenticated users redirected

---

## 📊 Comparison with Dashboard V1

| Aspect | V1 (apps/dashboard) | V2 (apps/dashboard-v2) | Improvement |
|--------|---------------------|------------------------|-------------|
| **Files** | 279 files | ~50 files (so far) | 82% reduction |
| **Creator Routes** | Mixed buyer/creator | Buyer-only | 100% separation |
| **Auth Complexity** | Shared flows | Isolated buyer auth | Clean & simple |
| **Error Handling** | Fallback to mock | Fail clean | Clear errors |
| **Codebase** | Complex | Simple | Maintainable |

---

## 📋 Next Steps (Phase 5)

### Stripe Production Integration
1. Add Stripe publishable key to environment variables
2. Create checkout session edge function
3. Implement real Stripe Checkout or Elements
4. Build webhook handler for subscription events
5. Sync subscription status with user_buyers.tier
6. Add billing portal integration

### Admin CRUD Operations
1. Build title create/edit forms
2. Implement delete functionality with confirmation
3. Add user management page
4. Build user approval workflow
5. Create featured titles carousel management

**Estimated Time**: 12-16 hours

---

## 🔗 Related Documentation

- [V2 PRD](../../docs/DASHBOARD_APP_V2_PRD.md) - Complete product requirements
- [V1 CLAUDE.md](../dashboard/CLAUDE.md) - Original dashboard app (reference)
- [Creator V2](../creator-v2/README.md) - Sister app for creators
- [Root CLAUDE.md](../../CLAUDE.md) - Monorepo documentation
- [Auth Documentation](../../docs/active/AUTH_DOCUMENTATION.md) - System-wide auth docs

---

## ❓ FAQ

### Why rebuild instead of refactor V1?
V1 has 279 files with mixed buyer/creator logic, complex fallbacks, and tight coupling. A clean rebuild following creator-v2's successful patterns provides a simpler, more maintainable codebase (46% file reduction target).

### How is this different from creator-v2?
Dashboard V2 is buyer-focused (AI chatbot, subscriptions, title discovery) while creator-v2 is creator-focused (title management). They share the same database but have completely isolated auth flows and features.

### What about V1 users?
V1 is being archived as a reference. All new buyer development happens in V2. Existing buyer data is shared via Supabase database (no migration needed).

---

**Last Updated**: 2025-10-26
**Version**: 2.0 (Phase 5 Complete)
**Status**: ✅ Production Ready - All Core Features Implemented
