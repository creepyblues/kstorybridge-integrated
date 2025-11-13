# CLAUDE.md - Website App

**App Scope**: Marketing website with basic authentication redirects to dashboard app. Focuses on content presentation and user acquisition.

**Last Updated**: 2025-11-11

> 📖 **See also**: [Root CLAUDE.md](../../CLAUDE.md) for monorepo commands, shared architecture, and cross-app patterns.

This file provides guidance to Claude Code (claude.ai/code) when working with the Website application.

## Development Commands

**From app directory** (`apps/website/`):
- `npm run dev` - Start development server on port 5173
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint for code linting
- `npm run preview` - Preview production build locally
- `npm i` - Install dependencies

**From root** (with Turborepo, ~50x faster cached builds):
- `npm run dev:website` - Start website only (port 5173)
- `npm run build:website` - Build website with intelligent caching
- `npm run build` - Build all apps (if website or shared packages changed)

**Local Development**: http://localhost:5173

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

**Authentication Flow**:
- **IMPORTANT**: This app does NOT handle authentication directly
- All auth pages (signup/signin) redirect to **Dashboard app** (dashboard.kstorybridge.com)
- Supabase handles auth with persistent sessions
- Client configuration is in `src/integrations/supabase/client.ts`
- **See**: [Root CLAUDE.md Authentication Flow](../../CLAUDE.md#authentication-flow) for complete details

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

### Page-Specific Design Patterns

**BuyersPagePreview** (AI-First Approach):
- **Primary Color**: `hanok-teal` (#4C9C9B)
- **Target**: Hollywood studios, streaming platforms, media buyers
- **Key Sections**:
  1. Hero with AI-first messaging ("Find Your Next Hit with AI Assistant")
  2. AI Assistant Showcase (Jinu chatbot demo, 30% focus)
  3. Three Pillars: AI Discovery, Rights Chain, Expert Support
  4. Rights Deep Dive with 4-step verification diagram (25% focus)
  5. 3-Step process with mixed colors (teal/coral/blue badges)
  6. Catalog preview with FeaturedTitlesCarousel
  7. Pricing (Free vs Pro) + Final CTA
- **Color Usage**: hanok-teal (primary CTAs), sunrise-coral (rights sections), porcelain-blue (support sections)

**CreatorsPagePreview** (Access-First Approach):
- **Primary Color**: `sunrise-coral` (#E07856)
- **Target**: Webtoon artists, web novel authors
- **Key Sections**:
  1. Hero with aspirational messaging ("Your Story Deserves the Global Stage")
  2. ACCESS Showcase with studio logo grid (7 logos + "50+" stat card, 30% focus)
  3. Three Guarantees: ACCESS, EXPERT, EASY DEAL
  4. EXPERT Deep Dive with cultural translation focus (30% focus)
  5. Before/After comparison (Traditional vs KStoryBridge)
  6. 3-Step journey with **consistent hanok-teal** badges
  7. Final CTA + Beehiiv newsletter
- **Color Usage**: sunrise-coral (primary CTAs, ACCESS), hanok-teal (EXPERT, step badges), porcelain-blue (EASY DEAL)
- **Logo Integration**: Supabase storage with fallback chain (.png → .jpg → .svg → .webp → text)

### Shared Component Patterns

**All preview pages use:**
- **Preview Banner**: Yellow sticky banner (`bg-yellow-50 border-b-2 border-yellow-400 py-3 px-4 sticky top-0 z-50`)
- **UniversalHeader**: Standard navigation
- **Footer**: Standard footer
- **Card Standard**: `bg-transparent border-gray-300 shadow-none rounded-2xl`
- **Icon Boxes**: `w-12 h-12 bg-{color}/10 rounded-lg` with lucide-react icons
- **Gradients**: `bg-gradient-to-b from-white to-porcelain-blue-50` (page background)
- **Before/After**: Red-50 (traditional) vs Green-50 (KStoryBridge) cards
- **Step Badges**: `w-16 h-16 bg-{color} text-white rounded-2xl` with shadow-lg

### Color Scheme Guidelines

**By Audience Type:**
- **Buyers**: hanok-teal primary (AI/tech focus)
- **Creators**: sunrise-coral primary (creative/passion focus)
- **Universal**: porcelain-blue accents, gray-300 borders

**Accent Colors:**
- hanok-teal: #4C9C9B (trust, technology, AI)
- sunrise-coral: #E07856 (creativity, passion, Hollywood)
- porcelain-blue-600: (support, deals, legal)
- gray tones: borders, backgrounds, neutral text

### Future Development Notes

**When creating new preview pages:**
1. Choose primary color based on target audience (buyers = teal, creators = coral)
2. Follow 7-section structure for consistency
3. Allocate 30% focus to Priority #1 feature
4. Use Before/After comparison for trust building
5. Keep step process to 3 steps max
6. Implement responsive grids: 2-col mobile → 4-col desktop
7. Store images in Supabase `/images/` bucket with fallback handling
8. Use lucide-react icons consistently
9. Test mobile (375px), tablet (768px), desktop (1024px+)
10. Document all custom patterns in PREVIEW_PAGES.md

**Complete architecture reference**: See [PREVIEW_PAGES.md](./PREVIEW_PAGES.md) - "Preview Page Architecture Reference" section

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

### Shared Patterns

For complete database patterns including:
- User table structures (user_buyers, user_creators)
- Query patterns (always use `.eq('email', user.email)`)
- Field naming conventions (snake_case)
- Tier system implementation

**See**: [Root CLAUDE.md Common Development Patterns](../../CLAUDE.md#common-development-patterns)