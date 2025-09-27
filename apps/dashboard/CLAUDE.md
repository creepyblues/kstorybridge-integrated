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

## Page Access Controls

### Account Type-Based Access (UPDATED 2025-01-14)

The dashboard implements different access levels based on user account types and specific authorization rules.

**Access Levels**:

### ✅ **Buyer Access**
Pages accessible to all users with `account_type: 'buyer'`:
- `/chat` - AI-powered chatbot for content discovery (Updated: Previously admin-only, now buyer-accessible)
- `/buyers/home` - Buyer dashboard
- `/buyers/titles` - Browse content catalog
- `/buyers/favorites` - Saved favorites
- `/buyers/news` - Industry news

### 🔒 **Admin-Only Access**
Pages restricted to specific admin emails (`sungho@dadble.com`, `kevin@sandstoneartists.com`):
- `/experiment` - Feature testing environment (gateway to all admin tools)
  - Includes: Vector Search Manager, OpenAI Testing, Chat History, Chatbot Feedback Analysis
- Individual tool pages accessible directly but intended to be accessed via Experiment page

### 👥 **Creator Access**
Pages accessible to users with `account_type: 'creator'`:
- `/creators/home` - Creator dashboard
- `/creators/titles` - Manage content listings
- `/creators/profile` - Creator profile management

**Implementation Pattern**:
```typescript
// Buyer access pattern
const accountType = user?.user_metadata?.account_type || 'buyer';
const isAuthorized = accountType === 'buyer';

// Admin access pattern
const isAuthorized = user?.email === 'sungho@dadble.com' || user?.email === 'kevin@sandstoneartists.com';

// Creator access pattern
const accountType = user?.user_metadata?.account_type;
const isAuthorized = accountType === 'creator';
```

**Recent Changes**:
- **2025-01-14**: Chat page (`/chat`) changed from admin-only to buyer-accessible to improve user experience

## Design Guidelines

> 🎨 **CRITICAL DESIGN REQUIREMENTS**: See [Root CLAUDE.md Design Guidelines](../../CLAUDE.md#design-guidelines) for:
> - **Card/Box Standard** (MANDATORY: `bg-transparent border-gray-300 shadow-none` - Follow `/buyers/profile` design)
> - **Button Standard** (MUST use `border-gray-300 hover:bg-gray-100` for ALL buttons)
> - **Typography Standard** (SF Pro is now the DEFAULT font - no classes needed)
> - **Color Policy** (black for text/labels, no yellow colors, no solid backgrounds)
> - **Pro Tier Standard** (MANDATORY: Use purple #AF52DE for ALL Pro/Suite tier components and features)
>
> **✨ NEW**: SF Pro is now the default font for the entire Dashboard app. All text automatically uses SF Pro typography.
>
> **⚠️ IMPORTANT**: ALL cards, boxes, and containers MUST use transparent backgrounds and no shadows as shown on the Profile page. This is now the mandatory standard across the entire application.
>
> **🔧 STANDARD COMPONENTS**: Use these components for consistent design:
> - **StandardButton** (`@/components/StandardButton`) - Consistent button with light grey hover
> - **StandardCard** (`@/components/StandardCard`) - Transparent card with proper borders
> - **Usage**: `import { StandardButton, StandardCard } from '@/components/StandardButton'` and `'@/components/StandardCard'`
>
> **💜 PRO TIER COLOR SYSTEM**:
> - **Primary Color**: `#AF52DE` (purple) - Available as `pro-purple` in Tailwind
> - **Usage**: `bg-pro-purple`, `text-pro-purple`, `border-pro-purple-500`, etc.
> - **Apply to**: Badges, buttons, icons, borders for Pro/Suite tier features only
> - **Examples**: Premium badges, Pro feature buttons, tier upgrade prompts, Crown icons
> - **Variants**: Full color scale available (50-900) for hover states and backgrounds
>
> **🎯 PRO TIER COMPONENTS**:
> - **StandardButton** with `variant="pro"` - Purple button for Pro actions
> - **ProBadge** (`@/components/ProBadge`) - Consistent Pro/Suite tier badges
> - **Usage Examples**:
>   ```tsx
>   <StandardButton variant="pro">Upgrade to Pro</StandardButton>
>   <ProBadge tier="pro" />
>   <Crown className="h-5 w-5 text-pro-purple" />
>   ```

## 🎨 Design System (NEW - 2025-01-26)

### Overview

The Dashboard now uses a **centralized design system** where changing ONE component file updates the design across ALL pages automatically. **No `<div>` elements** - only semantic components.

### 📁 Architecture - 3 Layers

**Layer 1: Base Components** (`@kstorybridge/ui`)
- Low-level primitives (Button, Card, Input, Badge)
- From shadcn/ui + Radix UI
- Handle accessibility automatically

**Layer 2: Design System** (`@/components/design-system`)
- **Surface** - Replaces all `<div>`, semantic layout primitive
- **Stack** / **Inline** - Layout with automatic spacing
- **EmptyState** - Standardized "no items found" pattern
- **More components coming**: ActionCard, StatCard, ContentCard, etc.

**Layer 3: App Components** (`@/components`)
- App-specific compositions: StandardButton, StandardCard, ProBadge

### 🎯 Core Principles

1. **Single Source of Truth** - All design values in `design-tokens.css`
2. **Semantic HTML** - Use `<Surface as="article">` not `<div>`
3. **Variant System** - Change design by passing props, not writing CSS
4. **Type Safety** - TypeScript types for all design tokens
5. **No Manual Styles** - Use components and variants only

### 📦 Design System Components

#### Surface (Replaces `<div>`)
```tsx
import { Surface } from '@/components/design-system';

// Standard card
<Surface variant="card" padding="md">Content</Surface>

// Semantic article
<Surface as="article" variant="elevated" padding="lg">Article content</Surface>

// Transparent wrapper
<Surface as="header" variant="transparent" padding="none">Header</Surface>
```

**Variants**: `card` (default), `elevated`, `flat`, `transparent`, `outlined`
**Padding**: `none`, `xs`, `sm`, `md`, `lg`, `xl`
**Spacing**: `none`, `xs`, `sm`, `md`, `lg`, `xl` (bottom margin)

#### Stack (Vertical Layout)
```tsx
import { Stack } from '@/components/design-system';

<Stack gap="md">
  <Surface>Item 1</Surface>
  <Surface>Item 2</Surface>
</Stack>
```

**Gap**: `none`, `xs`, `sm`, `md`, `lg`, `xl`
**Align**: `start`, `center`, `end`, `stretch`
**Justify**: `start`, `center`, `end`, `between`

#### Inline (Horizontal Layout)
```tsx
import { Inline } from '@/components/design-system';

<Inline gap="sm" align="center">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</Inline>
```

**Gap**: `none`, `xs`, `sm`, `md`, `lg`, `xl`
**Align**: `start`, `center`, `end`, `baseline`, `stretch`
**Justify**: `start`, `center`, `end`, `between`, `around`
**Wrap**: `wrap`, `nowrap`, `reverse`

#### EmptyState (Standardized Empty States)
```tsx
import { EmptyState } from '@/components/design-system';
import { Heart } from 'lucide-react';

// Basic
<EmptyState icon={Heart} title="No favorites found" />

// With description
<EmptyState
  icon={Search}
  title="No results"
  description="Try different keywords"
/>

// With action
<EmptyState
  icon={Inbox}
  title="All done!"
  action={<Button>Add New</Button>}
  size="lg"
/>
```

**Size**: `sm`, `default`, `lg`

### 🎨 Design Tokens (CSS Variables)

All design values are centralized in `src/styles/design-tokens.css`:

```css
:root {
  /* Spacing */
  --space-xs: 0.5rem;
  --space-sm: 0.75rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;

  /* Border Radius */
  --radius-sm: 0.5rem;
  --radius-md: 1rem;
  --radius-lg: 1.5rem;
  --radius-xl: 2rem;

  /* Shadows */
  --shadow-none: none;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);

  /* Component-specific */
  --surface-bg-default: transparent;
  --surface-border-color: var(--color-gray-300);
  --surface-shadow: var(--shadow-none);
  --surface-radius: var(--radius-xl);
}
```

**To change the design globally**: Edit `design-tokens.css` → Updates entire app!

### 📝 TypeScript Design Config

Type-safe access to design tokens via `design-config.ts`:

```typescript
import { designConfig } from '@/theme/design-config';

// Access tokens with TypeScript autocomplete
const mySpacing = designConfig.spacing.md;
const myRadius = designConfig.radius.xl;
const surfaceBg = designConfig.components.surface.bg.default;
```

### ✅ Migration Examples

**Before** (Old way):
```tsx
<Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6 sm:mb-8 lg:mb-12">
  <CardContent className="p-4 sm:p-6 text-center">
    <Heart className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-midnight-ink-400 mx-auto mb-3 sm:mb-4" />
    <h3 className="text-base sm:text-lg font-medium text-midnight-ink mb-2">No favorites found</h3>
  </CardContent>
</Card>
```

**After** (Design system):
```tsx
<EmptyState icon={Heart} title="No favorites found" />
```

**Result**: 7 lines → 1 line, fully consistent, design controlled centrally!

### 🚀 Benefits

1. **Change border color once** → Updates 50+ pages instantly
2. **Adjust card padding** → One CSS variable affects all cards
3. **No more `<div>`** → Semantic HTML everywhere
4. **Type-safe** → TypeScript autocomplete for all design values
5. **Consistent patterns** → EmptyState, ActionCard used everywhere
6. **Faster development** → Compose components, not copy styles
7. **Better accessibility** → Semantic HTML enforced
8. **Easier testing** → Components testable in isolation

### 🔄 Migration Strategy

**Migrated Pages** (Using design system):
- ✅ Favorites.tsx - Uses `<EmptyState>`

**To migrate a page**:
1. Import design system components: `import { Surface, EmptyState } from '@/components/design-system'`
2. Replace manual Card styling with `<Surface variant="card">`
3. Replace empty states with `<EmptyState>`
4. Use `<Stack>` / `<Inline>` for layouts instead of manual flex
5. Remove all hardcoded className styling

### 📚 Component Reference

**Files**:
- `src/styles/design-tokens.css` - All design values (SINGLE SOURCE OF TRUTH)
- `src/theme/design-config.ts` - TypeScript types and exports
- `src/components/design-system/Surface.tsx` - Base primitive
- `src/components/design-system/Stack.tsx` - Vertical layout
- `src/components/design-system/Inline.tsx` - Horizontal layout
- `src/components/design-system/EmptyState.tsx` - Empty state pattern
- `src/components/design-system/index.ts` - All exports

**Import Pattern**:
```tsx
import { Surface, Stack, Inline, EmptyState } from '@/components/design-system';
```

### 🎓 Design System Rules

**✅ DO:**
- Use Surface with semantic HTML: `<Surface as="article">`
- Use Stack/Inline for layouts
- Use EmptyState for "no items" states
- Use variants to control styling
- Change design in `design-tokens.css`

**❌ DON'T:**
- Use `<div>` directly (use Surface instead)
- Write inline styles or manual classes
- Copy-paste design patterns
- Create custom empty states
- Hardcode spacing values

---

### Badge Design Standards (UPDATED 2025-01-14)

**IMPORTANT**: All badges across the dashboard MUST follow the default Badge component design for consistency.

**Default Badge Styling** (from `packages/ui/src/components/badge.tsx`):
- **Shape**: `rounded-full` (fully circular/pill shape)
- **Padding**: `px-2.5 py-0.5` (horizontal: 10px, vertical: 2px)
- **Font Size**: `text-xs` (12px)
- **Font Weight**: `font-semibold` (NOT font-bold)
- **Text Transform**: Normal case (NO uppercase)
- **Letter Spacing**: Normal (NO tracking-wider)

**✅ CORRECT Badge Implementation**:
```tsx
// Standard badge with custom color
<span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
  BETA
</span>

// Using Badge component
<Badge className="bg-pro-purple text-white">Pro</Badge>
```

**❌ INCORRECT Badge Implementation**:
```tsx
// Wrong: Custom sizing and styling
<span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider">
  BETA
</span>
```

**Color Preservation Rule**:
- When standardizing badges, ALWAYS preserve the existing background and text colors
- Only update the sizing, shape, font weight, and text transform
- Common badge colors in the dashboard:
  - BETA badge: `#FF6B6B` (red)
  - Admin badge: `#AF52DE` (pro-purple)
  - Pro Plan badge: `bg-gray-200 text-gray-600`
  - Contact/View buttons: `bg-pro-purple text-white`

**Badge Locations**:
- CMSSidebar.tsx - BETA and Admin badges
- CMSHeader.tsx - User tier badges and mobile menu badges
- TitleDetailNew.tsx - Contact and View action buttons
- TitleDetail.tsx - PRO PLAN tier indicators
- ProBadge.tsx - Reusable Pro/Suite tier badge component

### Page Layout Standards (UPDATED 2025-01-26 - CENTRALIZED SYSTEM)

**IMPORTANT**: All pages MUST use the PageContainer component for consistent, centrally-controlled padding.

## Standard Pattern (MANDATORY)

ALL pages must use the PageContainer component:

```tsx
import { PageContainer } from '@/components/layout/PageContainer';

export default function MyPage() {
  return (
    <PageContainer>
      <h1>Page Content</h1>
      {/* Your page content */}
    </PageContainer>
  );
}
```

## Centralized Padding System

**Single Source of Truth**: `/src/styles/layout-variables.css`

All page padding is controlled by CSS variables in ONE file. This allows:
- ✅ **One-prompt changes**: "2x the padding" edits ONE file, affects ALL pages
- ✅ **Guaranteed consistency**: Impossible to have mismatched padding
- ✅ **Easy rollback**: Revert one file to fix all pages
- ✅ **Responsive built-in**: Mobile/tablet/desktop all centralized

### Current Padding Values

```css
/* Horizontal (left/right) padding */
--page-padding-x-mobile: 0.75rem;   /* 12px */
--page-padding-x-tablet: 1.5rem;    /* 24px */
--page-padding-x-desktop: 2rem;     /* 32px */

/* Vertical (top/bottom) padding */
--page-padding-y-mobile: 1rem;      /* 16px */
--page-padding-y-tablet: 1.5rem;    /* 24px */
--page-padding-y-desktop: 2rem;     /* 32px */
```

### How to Change Padding Globally

**Example: "2x the padding for left and right"**

Claude will:
1. Open `/src/styles/layout-variables.css`
2. Change ONLY horizontal padding variables:
   - `--page-padding-x-mobile: 1.5rem` (was 0.75rem)
   - `--page-padding-x-tablet: 3rem` (was 1.5rem)
   - `--page-padding-x-desktop: 4rem` (was 2rem)
3. ALL pages instantly update

**Example: "Reduce top/bottom padding on mobile"**

Claude will:
1. Open `/src/styles/layout-variables.css`
2. Change ONLY: `--page-padding-y-mobile: 0.5rem`
3. Mobile spacing updates everywhere

## Page Container Classes

**`.page-container`** - Standard container with all padding
```css
max-width: 80rem;  /* equivalent to max-w-7xl */
padding: var(--page-padding-*);
```

**`.page-container-no-vertical-padding`** - Horizontal padding only (for fixed elements)
```css
max-width: 80rem;
padding-left/right: var(--page-padding-x-*);
```

## ❌ DO NOT DO THIS

```jsx
// DON'T hardcode padding classes
<div className="px-3 sm:px-6 lg:px-8">

// DON'T create custom container patterns
<div className="max-w-7xl mx-auto py-4">

// DON'T bypass PageContainer
<div className="container">
```

All of these bypass the centralized system and will cause inconsistency.

**Migrated Pages (Using PageContainer)**:
- ✅ `/buyers/titles` (TitleList.tsx) - Migrated to centralized system (2025-01-26)
- ✅ `/buyers/favorites` (Favorites.tsx) - Migrated to centralized system (2025-01-26)
- ✅ `/buyers/chat` (Chat.tsx) - Migrated to centralized system (2025-01-26)

**Migration Status**: 3 core pages migrated. Additional pages should be migrated as they are updated.

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
