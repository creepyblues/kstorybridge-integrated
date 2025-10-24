# CLAUDE.md - Creator App

**App Scope**: Creator-focused dashboard for content management, title submissions, pitch deck uploads, and analytics. Dedicated app for Korean content creators (webtoon artists, web novel authors).

**Last Updated**: 2025-10-22

**Migration Status**: 🚧 Phase 1 Complete (8% of separation project) - See [Creator App Separation Project](../../docs/CREATOR_APP_QUICK_REFERENCE.md)

> 📖 **See also**: [Root CLAUDE.md](../../CLAUDE.md) for monorepo commands, shared architecture, and cross-app patterns.

This file provides guidance to Claude Code (claude.ai/code) when working with the Creator application.

---

## 📚 Documentation Index

### Essential Docs (Quick Links)
- **[Creator App Separation Project](../../docs/CREATOR_APP_QUICK_REFERENCE.md)** - Migration status and roadmap
- **[Design Standards](../../docs/active/DESIGN_SYSTEM.md)** - UI/UX standards (root-level)
- **[Auth Documentation](../../docs/active/AUTH_DOCUMENTATION.md)** - Complete auth system reference (root-level)
- **[Database Schema](../../docs/active/DATABASE_SCHEMA.md)** - Database schema reference

---

## Development Commands

- `npm run dev` - Start development server on port 8082
- `npm run build` - Build for production
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

**Note**: This app runs on port **8082**. Dashboard app runs on port 8081, website on 5173.

---

## Architecture Overview

React-based creator dashboard built with Vite, TypeScript, and shadcn/ui components. **Exclusively for creators** - clean URLs without `/creators` prefix for professional appearance.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **Backend**: Supabase (auth, database) - shared with dashboard
- **State**: TanStack Query + React Context
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod

### Key Patterns

**Authentication**:
- **Currently**: Shares authentication with dashboard app (temporary)
- **Planned**: Dedicated creator authentication at creator.kstorybridge.com
- Uses Supabase auth with custom AuthProvider (`src/hooks/useAuth.tsx`)
- Account type in user metadata determines routing
- OAuth redirects to `/auth/callback` in THIS app

**Auth Pages** (Creator-only):
- `/signin` - Creator sign in (redirects from `/signin/creator`)
- `/signup` - Creator signup (redirects from `/signup/creator`)
- `/auth/callback` - OAuth callback handler
- `/forgot-password` - Password reset

**Routing Philosophy**:
- **Clean URLs**: No `/creators` prefix (e.g., `/home` not `/creators/home`)
- **Professional**: Easier for marketing and creator communication
- **Dedicated**: All routes are creator-specific, no buyer routes

**Data Management**:
- Supabase client: `src/integrations/supabase/client.ts`
- Service layer: `src/services/`
- TanStack Query for server state
- Shared database with dashboard app (same Supabase project)

**Component Structure**:
- shadcn/ui: `src/components/ui/` (auto-generated, avoid editing)
- Custom: `src/components/`
- Layouts: `src/components/layout/` (includes CMSSidebar for creator menu)
- Pages: `src/pages/`

### Import Aliases
- `@/*` maps to `./src/*`

### Database
- Migrations: `supabase/migrations/` (separate from dashboard)
- Auto-generated types: `src/integrations/supabase/types.ts`
- Shared Supabase project: `dlrnrgcoguxlkkcitlpd`

---

## Creator App Routes

### Main Routes (Clean URLs)
- `/` - Redirects to `/home`
- `/home` - Creator dashboard home
- `/titles` - My titles list
- `/titles/add` - Add new title
- `/titles/:titleId` - Title detail view
- `/titles/:titleId/edit` - Edit title
- `/requests` - My requests (buyer inquiries)
- `/profile` - Creator profile
- `/news` - News and updates
- `/send-message` - Send message to admin

### Authentication Routes
- `/signin` - Creator sign in
- `/signup` - Creator signup
- `/forgot-password` - Password reset
- `/auth/callback` - OAuth callback

### Documentation Routes (Shared)
- `/docs` - Documentation index
- `/docs/schema` - Database schema
- `/docs/view/:filename` - Document viewer
- `/docs/ux` - UX dashboard
- `/docs/user_journey` - User journey map
- `/docs/messaging` - Messaging documentation

### Legacy Redirects (Backwards Compatibility)
- `/signin/creator` → `/signin`
- `/signup/creator` → `/signup`

---

## Key Features

### 1. Content Management
- **Title Submission**: Add new titles with comprehensive metadata
- **Title Editing**: Update title information, images, pitch decks
- **Pitch Deck Upload**: PDF upload with automated extraction (50+ fields)
- **Cover Image Management**: Title image uploads to Supabase storage

### 2. Analytics & Insights
- **Title Performance**: Views, likes, ratings for submitted content
- **Buyer Interest**: Track requests and inquiries from media buyers
- **Market Positioning**: See comparable titles and target audiences

### 3. Request Management
- **Buyer Requests**: View and respond to buyer inquiries
- **Message System**: Direct communication with platform administrators

### 4. Profile Management
- **Creator Profile**: Pen name, bio, portfolio, contact information
- **Content Portfolio**: Showcase all submitted titles in one place

---

## Protected Routes

### CreatorProtectedLayout
All creator routes are wrapped in `CreatorProtectedLayout` which:
- Verifies user is authenticated
- Checks account_type is 'creator'
- Redirects non-creators to appropriate app (future: cross-domain redirect)
- Includes CMSSidebar for navigation

### DocsProtectedLayout
Documentation routes require authentication but are accessible to all authenticated users (buyers and creators).

---

## Database Schema Guidelines

### Account Types
Standardized to `'buyer'` and `'creator'` only.

- ✅ **Creator**: `account_type: 'creator'` → `/home`

**Tables**:
- `user_creators` - Creator profiles

### Creator Profile Fields
- `pen_name`: Pen name/studio field (REQUIRED)
- `ip_owner_role`: REQUIRED (author | agent)
- `invitation_status`: invited (default) | active | pending
- `full_name`: Creator's full name
- `ip_owner_company`: Optional company/studio name
- `website_url`: Optional portfolio/website URL

**Field Naming**: Always use snake_case matching database fields.

---

## Page Access Controls

### Creator-Only Access
All routes except authentication and documentation are creator-only:
- `/home` - Creator dashboard
- `/titles` - My titles
- `/titles/add` - Add title
- `/titles/:titleId/edit` - Edit title
- `/requests` - My requests
- `/profile` - Creator profile
- `/news` - News
- `/send-message` - Send message

### Shared Access (Documentation)
Documentation routes accessible to all authenticated users:
- `/docs/*` - All documentation routes

---

## Design Guidelines

> 🎨 **See [Root DESIGN_SYSTEM.md](../../docs/active/DESIGN_SYSTEM.md)** for complete design standards:
> - Card/Box Standard (transparent backgrounds, no shadows)
> - Button Standard (light grey hover)
> - Typography (SF Pro default)
> - Color Policy (no yellow colors)
> - Hanok Teal Primary Color (#4C9C9B)

**Standard Components**:
- `StandardButton` (`@/components/StandardButton`)
- `StandardCard` (`@/components/StandardCard`)

**Design System Components** (`@/components/design-system`):
- `Surface` - Replaces `<div>`, semantic layout primitive
- `Stack` / `Inline` - Layout with automatic spacing
- `EmptyState` - Standardized empty states

**Reference**: Creator-specific design patterns use hanok-teal as primary accent color

---

## Development Notes

### Creator App Separation Status
**Current Phase**: Phase 1 Complete (8% of project)
- ✅ App scaffolding and structure created
- ✅ Package.json configured
- ✅ Root scripts added
- ✅ Buyer pages removed from creator app
- ✅ App.tsx rewritten with creator-only routes
- ✅ CMSSidebar simplified to creator menu only

**Next Critical Phases**:
- Phase 3: Cross-domain redirects (buyers → dashboard, creators → creator)
- Phase 6: Infrastructure setup (Vercel project, DNS configuration)
- Phase 7: OAuth configuration (add creator.kstorybridge.com callbacks)

**See**: [Creator App Separation Project](../../docs/CREATOR_APP_QUICK_REFERENCE.md) for complete roadmap

### Technical Configuration
- TypeScript config relaxed (noImplicitAny: false, strictNullChecks: false)
- ESLint: React + TypeScript, unused vars disabled
- Uses SWC for fast compilation
- Lovable-tagger plugin for dev mode tagging

### Migration Notes
- Currently shares Supabase project with dashboard app
- Future: Will have separate OAuth callbacks at creator.kstorybridge.com
- Cross-domain session sharing via Supabase auth
- Shared database tables (`user_creators`, `titles`, etc.)

---

## Quick Links

### Development
- Creator App: http://localhost:8082
- Dashboard App: http://localhost:8081
- Website: http://localhost:5173
- Supabase: https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd

### Production (Planned)
- Creator App: https://creator.kstorybridge.com (🚧 Not yet deployed)
- Dashboard App: https://dashboard.kstorybridge.com
- Website: https://kstorybridge.com

### Documentation
- [Root CLAUDE.md](../../CLAUDE.md) - Monorepo documentation
- [Creator App Separation](../../docs/CREATOR_APP_QUICK_REFERENCE.md) - Migration status
- [Auth Documentation](../../docs/active/AUTH_DOCUMENTATION.md) - Complete auth reference
- [Design System](../../docs/active/DESIGN_SYSTEM.md) - UI/UX standards
- [Database Schema](../../docs/active/DATABASE_SCHEMA.md) - Database reference

---

## Common Tasks

### Adding a New Creator Page
1. Create page component in `src/pages/[PageName].tsx`
2. Add lazy import to `App.tsx`
3. Add route wrapped in `<CreatorProtectedLayout>`
4. Update CMSSidebar navigation if needed

### Updating Creator Profile Fields
1. Check `user_creators` table schema
2. Update form in `Profile.tsx`
3. Use snake_case field names matching database
4. Always include `ip_owner_role` (REQUIRED field)

### Testing Authentication
```bash
# Start all 3 apps
npm run dev:website   # Terminal 1
npm run dev:dashboard # Terminal 2
npm run dev:creator   # Terminal 3

# Test creator signup flow
1. Visit localhost:5173
2. Click "Creator Signup"
3. Should redirect to localhost:8082/signup (when cross-domain is implemented)
4. After auth, should land at localhost:8082/home
```

---

**For complete design standards, see [Root DESIGN_SYSTEM.md](../../docs/active/DESIGN_SYSTEM.md)**
**For auth flow details, see [Root AUTH_DOCUMENTATION.md](../../docs/active/AUTH_DOCUMENTATION.md)**
**For migration status, see [Creator App Separation](../../docs/CREATOR_APP_QUICK_REFERENCE.md)**
