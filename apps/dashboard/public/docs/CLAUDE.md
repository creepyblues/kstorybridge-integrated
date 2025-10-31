# CLAUDE.md - Dashboard App

**App Scope**: Buyer-focused dashboard with AI chatbot, tier-based access control, premium content, and Stripe integration. Contains authentication pages for both buyers and creators (creator auth will migrate to creator app in future).

**Last Updated**: 2025-10-29

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

- `npm run dev` - Start development server on port 8081
- `npm run build` - Build for production
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

**Note**: This app runs on port **8081**. Creator app runs on port 8082, website on 5173.

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

**Authentication** (CRITICAL):
- **This app currently contains authentication pages for BOTH buyers and creators**
- Website app redirects here for authentication
- Uses Supabase auth with custom AuthProvider (`src/hooks/useAuth.tsx`)
- Account type in user metadata determines dashboard routing
- OAuth redirects to `/auth/callback` in THIS app
- **Multi-environment OAuth**: Explicit domain detection for production, staging, and localhost
  - Production: `dashboard.kstorybridge.com/auth/callback`
  - Staging: `dashboard-v2.kstorybridge.com/auth/callback`
  - Localhost: `localhost:8081/auth/callback`
- **Future**: Creator authentication will move to creator app (separate at creator.kstorybridge.com)

**Auth Pages**:
- `/signin` - Sign in
- `/signup/buyer` - Buyer signup
- `/signup/creator` - Creator signup
- `/auth/callback` - OAuth callback handler
- `/forgot-password` - Password reset

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

## 📄 Pitch Deck Extraction

**Status**: ✅ v2.0 Enhanced Comprehensive Extraction

Automated pitch deck analysis extracting 50+ structured fields using GPT-4o.

- **Admin UI**: `/admin/pitch-extraction-test`
- **Edge Function**: `extract-pitch-test` (v7)
- **Database**: `title_content_analysis` table
- **Cost**: ~$0.15-0.20 per deck

**See**: [Pitch Deck System Documentation](docs/PITCH_DECK_SYSTEM.md)

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
