# CLAUDE.md - Dashboard App

**App Scope**: User dashboard for authenticated buyers and creators with complex authentication flows, tier-based access control, and premium content management.

**Last Updated**: 2025-01-14

> 📖 **See also**: [Root CLAUDE.md](../../CLAUDE.md) for monorepo commands, shared architecture, and cross-app patterns.

This file provides guidance to Claude Code (claude.ai/code) when working with the Dashboard application.

## Development Commands

- `npm run dev` - Start development server on port 8080
- `npm run build` - Build for production  
- `npm run build:dev` - Build for development mode
- `npm run lint` - Run ESLint on all files
- `npm run preview` - Preview production build locally

## Architecture Overview

This is a React-based dashboard application for KStoryBridge, built with Vite, TypeScript, and shadcn/ui components. The application serves different dashboards based on user account types (buyers vs creators).

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui components + Radix UI primitives + Tailwind CSS
- **Backend**: Supabase (authentication, database)
- **State Management**: TanStack React Query + React Context
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation

### Key Architecture Patterns

**Authentication Flow (CRITICAL)**: 
- **This app contains ALL authentication pages** (signin, signup, OAuth callback)
- **Website app redirects here for authentication**
- Uses Supabase auth with custom AuthProvider context (`src/hooks/useAuth.tsx`)
- ProtectedRoute component wraps authenticated pages
- Account type stored in user metadata determines dashboard type
- OAuth redirects to `/auth/callback` in THIS app

**Authentication Pages**:
- `/signin` - Sign in page
- `/signup` - Generic signup redirect
- `/signup/buyer` - Buyer signup flow
- `/signup/creator` - Creator signup flow
- `/auth/callback` - OAuth callback handler
- `/forgot-password` - Password reset

**Dashboard Architecture**:
- Main Dashboard component (`src/pages/Dashboard.tsx`) routes to BuyerDashboard or CreatorDashboard based on user account type
- All authenticated pages wrapped in CMSLayout with sidebar navigation
- Dark theme with gradient background styling

**Data Management**:
- Supabase client configured in `src/integrations/supabase/client.ts`  
- Service layer in `src/services/` for business logic (favorites, titles)
- TanStack Query for server state management

**Component Structure**:
- shadcn/ui components in `src/components/ui/` (auto-generated, avoid editing)
- Custom components in `src/components/`
- Layout components in `src/components/layout/`
- Page components in `src/pages/`

### Import Aliases
- `@/*` maps to `./src/*` for clean imports

### Database
- Supabase migrations in `supabase/migrations/`
- Database types auto-generated in `src/integrations/supabase/types.ts`

### Development Notes
- TypeScript config is relaxed (noImplicitAny: false, strictNullChecks: false)
- ESLint configured for React + TypeScript with unused vars disabled
- Uses SWC for fast compilation
- Lovable-tagger plugin for development mode component tagging

## Performance Optimization

### ⚡ Tier System Optimization (CRITICAL)

**Problem**: Each `TierGatedContent` component was making individual database queries, causing slow page loads.

**Solution**: Implemented centralized tier management with React Context.

**Performance Gains**:
- 70-80% faster loading times
- 99% reduction in database queries (from N to 1 per page)
- Better user experience with no individual loading states

**Usage Pattern for Pages with Premium Content**:
```jsx
import { TierProvider } from '@/contexts/TierContext';
import OptimizedTierGatedContent from '@/components/OptimizedTierGatedContent';

// Wrap your page component
export default function MyPage() {
  return (
    <TierProvider>
      <MyPageContent />
    </TierProvider>
  );
}

// Use optimized components
<OptimizedTierGatedContent requiredTier="pro">
  <PremiumContent />
</OptimizedTierGatedContent>
```

**Migrated Pages**:
- ✅ `Titles.tsx`
- ✅ `TitleDetail.tsx`

**Test Performance**: `npm run test:tier-performance`

**Full Documentation**: See `TIER_OPTIMIZATION.md`

## Local Testing Environment

### Localhost OAuth Testing Setup
For local OAuth testing without production redirects, see `LOCALHOST_TESTING_SETUP.md`.

**Environment Variables**:
- `VITE_SUPABASE_URL` - Local Supabase URL (http://localhost:54321)
- `VITE_SUPABASE_ANON_KEY` - Local Supabase anon key  
- `VITE_LOCAL_TESTING=true` - Enable local testing mode
- `VITE_OAUTH_TESTING=true` - Enable OAuth debugging
- `VITE_AUTH_DEBUG=true` - Enable authentication debug logs

**Local Supabase Setup**:
```bash
# Start local Supabase stack
cd supabase
npx supabase start

# Access Studio at: http://localhost:54324
```

**OAuth Provider Configuration** (Local):
- Site URL: `http://localhost:8081`
- Redirect URLs: `http://localhost:8081/auth/callback`

## Database Schema Guidelines

### Account Type Standardization (UPDATED 2024-09-10)

**IMPORTANT CHANGE**: Account types standardized to `'buyer'` and `'creator'` only.

**Account Type System**:
- ✅ **Buyer**: `account_type: 'buyer'` → Routes to `/buyers/home`
- ✅ **Creator**: `account_type: 'creator'` → Routes to `/creators/home`  
- ❌ **Legacy**: Historical creator values automatically convert to `'creator'`

**Database Tables**:
- `user_buyers` - Buyer account profiles
- `user_creators` - Creator account profiles

**TypeScript Types**:
```typescript
export type AccountType = 'buyer' | 'creator';

// Database enum updated to:
account_type: "creator" | "buyer"
```

**Edge Function Implementation**:
- `create-creator-profile` - Handles OAuth creator profile creation
- Bypasses disabled database triggers using service role
- Automatic profile creation during OAuth callback

### User Profile Fields

**Buyer Profiles (`user_buyers` table):**
- ✅ **CORRECT**: Use `tier` field for user access level (default: 'basic')
- **Tier Hierarchy**: basic (default), invited, pro, suite
- **New Signups**: Default to 'basic' tier (changed from 'invited' in 2025-08-21 update)

**Creator Profiles (`user_creators` table):**
- ✅ **CORRECT**: Use `pen_name` field for pen name/studio information
- ❌ **INCORRECT**: Do NOT use legacy field names
- **Metadata Mapping**: Store and read as `pen_name` in metadata

**Field Implementation Rules:**
```typescript
// ✅ Correct Profile Creation
const profile = {
  pen_name: user.user_metadata?.pen_name,
  tier: user.user_metadata?.tier || 'basic' // Default to basic
}

// ✅ Correct Database Query
.select('pen_name, ip_owner_role, ip_owner_company')
.from('user_creators')
```

**Standard Implementation:**
- New signups: Store `pen_name` in metadata and database
- Database operations: Always use `pen_name` column
- Metadata: Use `pen_name` key consistently
- Tier system: Default to 'basic' for new user_buyers

## Design Guidelines

> 🎨 **Color Guidelines**: See [Root CLAUDE.md Design Guidelines](../../CLAUDE.md#design-guidelines) for comprehensive color usage policy and approved palette.

### Design Principles (STRICT)
1. **NO raw HTML elements** - Use MUI components only (Surface replaces div)
2. **200 lines max per file** - Aggressively split components
3. **DRY everything** - Reusable components and hooks
4. **Atomic Design** - Atoms → Molecules → Organisms → Templates
5. **Type-safe** - Full TypeScript, no `any` types
6. **SSR First** - Use Next.js SSR/ISR for performance
7. **Component Composition** - Build complex from simple
8. **Client Components Minimized** - Always prefer SSR, use "use client" sparingly
9. **NO FALLBACKS OR WORKAROUNDS** - Never use setTimeout, fallback patterns, or workarounds
10. **NO COMPROMISES** - Fix root causes, not symptoms. No shortcuts or band-aid solutions
