# CLAUDE.md - Website App

**App Scope**: Marketing website with basic authentication redirects to dashboard app. Focuses on content presentation and user acquisition.

**Last Updated**: 2025-01-14

> 📖 **See also**: [Root CLAUDE.md](../../CLAUDE.md) for monorepo commands, shared architecture, and cross-app patterns.

This file provides guidance to Claude Code (claude.ai/code) when working with the Website application.

## Development Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint for code linting
- `npm run preview` - Preview production build locally
- `npm i` - Install dependencies

## Architecture Overview

This is a React TypeScript web application built for K Story Bridge, a platform connecting Korean content creators with global media buyers.

### Tech Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: React Router DOM v6
- **Backend**: Supabase for authentication and database
- **State Management**: React Context (LanguageContext)
- **UI Components**: Radix UI primitives with shadcn/ui

### Project Structure

**Pages (`src/pages/`)**:
- Landing pages: `HomePage`, `CreatorsPage`, `BuyersPage`, `AboutPage`, `PricingPage`
- Authentication: `SignupPage`, `BuyerSignupPage`, `CreatorSignupPage`, `SigninPage`
- Dashboard: `DashboardInvited`
- Error handling: `NotFound`

**Core Components (`src/components/`)**:
- `Header` - Main navigation with auth, language selector, mobile menu
- `Footer` - Site footer
- `KoreanPattern` - Cultural design element
- `ui/` - shadcn/ui component library (buttons, forms, dialogs, etc.)

**Key Features**:
- **Internationalization**: Built-in English/Korean language support via `LanguageContext`
- **Supabase Integration**: Authentication and database via `src/integrations/supabase/`
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Database Schema (Supabase)
The application uses Supabase with migrations in `supabase/migrations/`. Check these files to understand the data model.

### Important Implementation Notes

**Language System**: The app uses a custom translation system in `LanguageContext.tsx`. All user-facing text should use the `t()` function for translations. Both English and Korean translations are stored in the same file.

**Authentication Flow**: Supabase handles auth with persistent sessions. The client configuration is in `src/integrations/supabase/client.ts`.

**Component Patterns**: 
- Uses shadcn/ui conventions for component structure
- Follows React functional component patterns with hooks
- TypeScript interfaces are defined inline or in `src/integrations/supabase/types.ts`

**Routing**: All routes are defined in `App.tsx`. The app uses client-side routing with React Router.

## Preview Pages System (NEW - 2025-10-13)

The website app now supports **Preview Pages** for safe testing of page redesigns before production deployment.

### Quick Start

**View Active Preview**:
- Preview URL: `http://localhost:5173/buyers-preview`
- Production URL: `http://localhost:5173/buyers` (compare side-by-side)
- Strategy Doc: [BUYERS_PAGE_OVERHAUL.md](../../apps/dashboard/public/docs/BUYERS_PAGE_OVERHAUL.md)

**Key Features**:
- ✅ Separate route pattern: `/*-preview`
- ✅ Development-only (blocked in production via `import.meta.env.DEV`)
- ✅ Visual "PREVIEW MODE" banner with link to production
- ✅ Uses actual design system components
- ✅ Fully interactive testing environment

### Creating New Preview Pages

1. **Create Component**: `/src/pages/[PageName]Preview.tsx`
2. **Add Import**: Add lazy import to `App.tsx`
3. **Add Route**: Wrap route in `{import.meta.env.DEV && <Route ... />}`
4. **Include Banner**: Copy preview banner from `BuyersPagePreview.tsx`
5. **Test**: Visit `http://localhost:5173/[page-name]-preview`

### Complete Documentation

See **[PREVIEW_PAGES.md](./PREVIEW_PAGES.md)** for:
- Detailed implementation guide
- Naming conventions
- Best practices
- Testing workflow
- Troubleshooting

### Active Preview Pages

| Page | Preview Route | Production Route | Status | Created |
|------|--------------|------------------|--------|---------|
| Buyers | `/buyers-preview` | `/buyers` | Active | 2025-10-13 |
| Creators | `/creators-preview` | `/creators` | Active | 2025-10-14 |

### Safety Features

**Production Protection**:
- Preview routes only exist when `import.meta.env.DEV === true`
- Build process automatically excludes preview pages from production
- No environment variables needed (automatic via Vite)

**Visual Distinction**:
- Yellow "PREVIEW MODE" banner (sticky top)
- Link to production page for comparison
- Timestamp showing when preview was created

### Example Usage

```tsx
// In App.tsx
const BuyersPagePreview = lazy(() => import("./pages/BuyersPagePreview"));

// Route (development-only)
{import.meta.env.DEV && <Route path="/buyers-preview" element={<BuyersPagePreview />} />}
```

**Important**: Never remove the `import.meta.env.DEV &&` check or preview pages will deploy to production.

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

## Development Workflow

1. Install dependencies: `npm i`
2. Start development server: `npm run dev`
3. Make changes and test locally
4. Run linting: `npm run lint`
5. Build for production: `npm run build`

The project is connected to Lovable for collaborative development, but can be developed locally using standard Node.js tools.

## Database Schema Guidelines

### User Tier System

**Buyer Tier Management:**
- Default tier for new signups: 'basic' (changed from 'invited' in 2025-08-21 update)
- All signup methods (email and OAuth) set tier to 'basic'
- Tier hierarchy: basic (default), invited (legacy), pro, suite

**✅ Correct Signup Implementation:**
```typescript
// Both email and OAuth signups
const metadata = {
  tier: 'basic', // Always set to 'basic' for new signups
  account_type: 'buyer'
}
```

### User Profile Field Naming

**Critical Requirement**: Always use `pen_name` for creator profiles.

**Note**: Creator profiles are stored in the `user_creators` table (renamed from `user_ipowners` on 2025-09-10).

**✅ Correct Implementation:**
```typescript
// SignupForm metadata
const metadata = {
  pen_name: formData.penNameOrStudio  // Store as pen_name in metadata
}

// Database insertion (triggers)
INSERT INTO user_creators (pen_name, ...) 
VALUES (NEW.raw_user_meta_data->>'pen_name', ...)
```

**❌ Legacy Field (Do NOT Use):**
- Old field name found in historical migrations only
- **Do NOT use in new code**
- Historical reference only

**Standard Implementation:**
- **New signups**: Always use `pen_name` in metadata and database
- **Database operations**: Always target `pen_name` column
- **Metadata**: Store as `pen_name` key