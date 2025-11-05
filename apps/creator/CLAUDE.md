# CLAUDE.md - Creator App V2

**App Scope**: Creator-focused dashboard for content management, title submissions, and profile management. Dedicated app for Korean content creators (webtoon artists, web novel authors, agents).

**Last Updated**: 2025-11-02

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

### 3. Authentication System
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

**✅ Exemplary Page**: `src/pages/Profile.tsx`
- Perfect adherence to card styling
- Correct badge usage
- Proper responsive margins
- Standard button patterns

**Reference**: Dashboard `/buyers/profile` page for visual standards

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

**Last Updated**: 2025-10-28
**Status**: ✅ PRODUCTION READY
**Version**: 2.0.0
