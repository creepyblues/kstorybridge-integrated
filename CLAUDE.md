# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Commands

### Root Level Commands
- `npm run dev:dashboard` - Start dashboard development server
- `npm run dev:website` - Start website development server
- `npm run dev:admin` - Start admin development server
- `npm run build:dashboard` - Build dashboard for production
- `npm run build:website` - Build website for production
- `npm run build:admin` - Build admin for production
- `npm run build:all` - Build all three applications
- `npm run lint:all` - Run linting on all applications
- `npm install` - Install all workspace dependencies

### Individual Application Commands
Run these from within `apps/dashboard/`, `apps/website/`, or `apps/admin/`:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## Architecture Overview

This is a monorepo containing three related React TypeScript applications for KStoryBridge - a platform connecting Korean content creators with global media buyers.

### Project Structure
```
├── apps/
│   ├── dashboard/     # User dashboard for authenticated users  
│   ├── website/       # Marketing website and authentication
│   └── admin/         # Admin portal for authorized personnel
├── packages/          # Shared libraries (currently empty)
└── node_modules/      # Workspace dependencies
```

### Shared Technology Stack
All three applications share similar technology stacks:
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components + Radix UI
- **Backend**: Supabase (shared database, authentication)
- **State Management**: TanStack React Query + React Context
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation

### TypeScript Configuration
- Root `tsconfig.json` provides path aliases:
  - `@dashboard/*` → `./apps/dashboard/src/*`
  - `@website/*` → `./apps/website/src/*`
  - `@shared/*` → `./packages/*/src/*`
- Both apps use relaxed TypeScript settings (strict: false)

### Database & Backend
- Single Supabase project (`dlrnrgcoguxlkkcitlpd`) shared between applications
- Database schemas differ between apps:
  - **Dashboard**: Focuses on `profiles` table with account_type, buyer/creator roles
  - **Website**: Focuses on `titles` table for content management
- Supabase migrations exist in both `apps/*/supabase/migrations/`
- Auto-generated types in `src/integrations/supabase/types.ts`

## Key Architectural Patterns

### Authentication & User Flow (UPDATED 2024-09-10)

**IMPORTANT**: Authentication pages are in the Dashboard app, NOT the Website app.

1. Users visit **Website** (`kstorybridge.com`) for marketing content
2. Website **redirects to Dashboard** (`dashboard.kstorybridge.com`) for authentication:
   - `/signup/buyer` - Buyer signup flow
   - `/signup/creator` - Creator signup flow (formerly IP Owner)
   - `/signin` - Sign in page
   - `/auth/callback` - OAuth callback handler
3. After authentication, users stay in **Dashboard** (`dashboard.kstorybridge.com`)
4. Dashboard shows different interfaces based on `account_type`:
   - **Buyers**: Route to `/buyers/home`
   - **Creators**: Route to `/creators/home`

**Note**: Account types standardized to 'buyer' and 'creator' only (no more 'ip_owner')

### Shared Components
Both applications use shadcn/ui component library with identical components in `src/components/ui/`. These are auto-generated and should not be manually edited.

### Development Workflow
1. Install dependencies at root: `npm install`
2. Develop applications independently using workspace commands
3. Both apps can run simultaneously on different ports
4. Shared Supabase backend ensures data consistency

### Local Testing with Cross-Domain Authentication

The applications support flexible URL configuration for local testing scenarios where users need to authenticate on the website and then access the dashboard.

#### Option 1: Default Ports (Simplest)
```bash
npm run dev:website   # http://localhost:5173
npm run dev:dashboard # http://localhost:8081
```
No additional configuration needed - redirects work automatically between ports.

#### Option 2: Custom Environment Variables
Copy `.env.local.example` to `.env.local` in each app directory and customize:

**apps/website/.env.local:**
```
VITE_DASHBOARD_URL=http://localhost:8081
VITE_WEBSITE_URL=http://localhost:5173
```

**apps/dashboard/.env.local:**
```
VITE_WEBSITE_URL=http://localhost:5173
VITE_DASHBOARD_URL=http://localhost:8081
```

#### Option 3: Hosts File for Realistic Testing
Add to `/etc/hosts`:
```
127.0.0.1 kstorybridge.com
127.0.0.1 dashboard.kstorybridge.com
```

Then set environment variables:
```
VITE_DASHBOARD_URL=http://dashboard.kstorybridge.com:8081
VITE_WEBSITE_URL=http://kstorybridge.com:5173
```

Access via:
- Website: `http://kstorybridge.com:5173`
- Dashboard: `http://dashboard.kstorybridge.com:8081`

## Common Development Patterns & Best Practices

### Database Operations

**Standard Supabase Configuration:**
```typescript
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA'
```

**Query Patterns:**
- ✅ Use `email` for user lookups: `.eq('email', user.email)`
- ❌ Avoid `user_id` - this field doesn't exist in user tables
- Handle null/undefined values appropriately
- Always include error handling with try/catch blocks

**User Table Structure:**
- `user_buyers` - Buyer accounts with `tier` field (basic|invited|pro|suite, default: 'basic')
- `user_creators` - Creator/IP owner accounts (renamed from `user_ipowners` 2025-09-10)
- `profiles` - Legacy profile data (being phased out)
- Query by `email` field, not `user_id`

### Tier System (Dashboard)

**Buyer Tier Hierarchy:**
- `basic` (1) - Default tier, standard features
- `invited` (0) - Restricted access (legacy/special cases)
- `pro` (2) - Premium content access
- `suite` (3) - Full feature access

**Implementation:**
- Use `useTierAccess()` hook for tier checking
- Field `tier` in `user_buyers` table (replaced `invitation_status`)
- Default tier for new signups: 'basic' (changed from 'invited' in 2025-08-21 update)
- Premium content gating with `TierGatedContent` component

### Content Management (Titles Table)

**Complete Field List** (Always show ALL when requested):
- **Basic**: `title_id`, `title_name_kr`, `title_name_en`, `description`, `synopsis`, `tagline`, `note`
- **Authors**: `author`, `story_author`, `art_author`, `writer`, `illustrator`  
- **Rights**: `rights`, `rights_owner` (separate fields), `creator_id`
- **Content**: `genre`, `content_format`, `chapters`, `completed`, `tags`
- **Media**: `title_image`, `title_url`, `pitch`
- **Metrics**: `views`, `likes`, `rating`, `rating_count`
- **Market**: `perfect_for`, `comps` (array), `tone`, `audience`
- **System**: `created_at`, `updated_at`

### Authentication Patterns

**Dashboard Authentication:**
- Uses shared Supabase auth + tier checking
- Localhost dev: Configurable mock vs real data
- Real data queries use `email`, not `user_id`

**Admin Authentication:**
- Separate `admin` table for access control
- No cross-domain dependencies with other apps
- Email verification against admin table

### UI/UX Standards

**Component Consistency:**
- Use shadcn/ui components consistently
- Follow color scheme: hanok-teal, midnight-ink, porcelain-blue
- Card-based layouts for content sections
- Loading states and error handling

**🚫 NEVER USE YELLOW COLORS:**
- Do not use any yellow background colors (`bg-yellow-*`, `hover:bg-yellow-*`)
- Do not use yellow borders, text colors, or icons
- Replace yellow (#FBBC05, #FCD34D, etc.) with neutral colors like gray-500 (#6B7280) or brand colors
- Use `hover:bg-white hover:border-gray-400 transition-colors` for button hover states

**Form Patterns:**
- React Hook Form + Zod validation
- Array fields: comma-separated input with proper parsing
- Confirmation dialogs for destructive actions
- Field validation and error display

### Script Development

**Data Generation Scripts:**
- Always include `--dry-run` mode for testing
- Use comprehensive logging with emoji indicators
- Handle both AI and fallback processing methods
- Include summary statistics and error reporting
- Environment variable configuration for API keys

**Example Script Structure:**
```javascript
// Command line argument parsing
const isDryRun = args.includes('--dry-run')
const limit = args.find(arg => arg.startsWith('--limit='))

// Process with error handling
try {
  const results = await processData()
  displaySummary(results)
} catch (error) {
  console.error('❌ Operation failed:', error)
  process.exit(1)
}
```

### Build & Testing

**Quality Checks:**
- Always run `npm run build` after significant changes
- Check TypeScript compilation errors
- Verify all imports resolve correctly
- Test database operations on small datasets first

**Deployment Preparation:**
- Ensure all environment variables are documented
- Test cross-app authentication flows
- Verify database migrations are applied
- Check responsive design and accessibility

### Common Issues & Solutions

**Database Schema:**
- Field names may differ between display and storage
- Array fields (tags, comps) need special form handling
- Handle both `rights` and `rights_owner` as distinct fields
- Null/undefined value handling in displays
- **IMPORTANT**: Always use `pen_name` field for IP owner profiles

**Authentication:**
- Mock vs real data configuration for localhost development
- Tier-based content access implementation
- Cross-domain session management between apps

**Performance:**
- Rate limiting for external API calls
- Batch processing for large dataset operations
- Proper error handling and fallback methods

## Important Notes

- **Database Types**: Auto-generated, do not edit manually
- **UI Components**: shadcn/ui components in `ui/` folders are generated, avoid direct edits  
- **Supabase Config**: All apps share same project ID but have separate migration folders
- **User Queries**: Always use `email` field, never `user_id` (doesn't exist)
- **Data Completeness**: When showing "all data", include ALL available fields
- **Testing**: Always test with small datasets first, use dry-run modes
- **Linting**: ESLint configured with unused variables disabled in all applications
- **Build Verification**: Run build command after significant changes

The individual CLAUDE.md files in each application (`apps/*/CLAUDE.md`) provide detailed app-specific guidance and should be consulted for application-specific development tasks.
- Always reference **DATABASE_SCHEMA.md** for database-related coding
- Always reference **AUTH_DOCUMENTATION.md** for authentication-related information
- Always reference **SLACK_BLACKLIST_DOCUMENTATION.md** for Slack notification blacklist management
- Always consider both desktop and mobile
- Do not auto commit to github
- When making structural changes such as db schema change, auth flow, account types, policy change, etc, make sure to reflect these changes in the appropriate documentation files (DATABASE_SCHEMA.md for database, AUTH_DOCUMENTATION.md for auth, or CLAUDE.md for general guidance) for future consistency

## Slack Notification System

### Blacklist Management
All Slack notifications are filtered through a comprehensive blacklist system to prevent internal team notifications. Current blacklisted accounts:
- `sungho@dadble.com`
- `kevin@sandstoneartists.com`
- `creepyblues@gmail.com`

**CRITICAL**: When implementing ANY Slack notifications, ALWAYS use the centralized utilities:
```typescript
import { sendSlackNotification } from './slack';
```

**Never bypass the blacklist** by making direct API calls. See **SLACK_BLACKLIST_DOCUMENTATION.md** for complete implementation details.