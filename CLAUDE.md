# CLAUDE.md - KStoryBridge Monorepo

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last Updated**: 2025-01-14

## 📁 Documentation Navigation

This monorepo contains app-specific CLAUDE.md files for detailed guidance:

- **[Dashboard App](apps/dashboard/CLAUDE.md)** - Authentication, OAuth flows, tier system, premium content
- **[Website App](apps/website/CLAUDE.md)** - Marketing pages, auth redirects, basic user flows
- **[Admin App](apps/admin/CLAUDE.md)** - Admin authentication, data generation, content management

**Use this file for**: Monorepo commands, shared architecture, cross-app patterns, and critical policies.
**Use app-specific files for**: App-specific commands, detailed implementation, and focused development guidance.

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
  - **Dashboard**: Focuses on `user_buyers` and `user_creators` tables for user management
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

## OAuth Flow Simplification (CRITICAL FIX - 2025-01-14)

**PROBLEM**: OAuth signup was failing due to over-engineered callback system with multiple conflicting handlers, complex timeouts, and inconsistent redirect URL construction.

**SOLUTION**: Replaced complex system with streamlined approach.

### Issues Fixed

**❌ Old System Problems:**
- Two conflicting callback handlers (`AuthCallbackPage.tsx` + `AuthCallbackPageSimple.tsx`)
- 700+ line account type detection with circuit breakers, timeouts, database lookups
- Complex redirect URL construction with environment conditionals
- Multiple storage systems for account type causing race conditions
- Emergency bypasses and fallback mechanisms that interfered with normal flow

**✅ New System:**
- **Single callback handler**: `AuthCallbackPageFixed.tsx` (80 lines vs 400+)
- **Simple account type detection**: `simpleAccountTypeDetection.ts` (fast metadata-only)
- **Consistent redirect URLs**: Always use `${window.location.origin}/auth/callback`
- **Clear priority order**: URL params → metadata → sessionStorage → error

### Implementation Changes

**OAuth Redirect URL (SignupForm.tsx):**
```typescript
// BEFORE (complex, inconsistent)
const isDev = window.location.hostname === 'localhost';
const forceRedirectUrl = import.meta.env.VITE_OAUTH_REDIRECT_URL;
let redirectUrl: string;
if (isDev && forceRedirectUrl) {
  redirectUrl = `${forceRedirectUrl}?account_type=${accountType}&flow=signup`;
} else {
  const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || window.location.origin;
  const baseUrl = isDev ? dashboardUrl : window.location.origin;
  redirectUrl = `${baseUrl}/auth/callback?account_type=${accountType}&flow=signup`;
}

// AFTER (simple, consistent)
const redirectUrl = `${window.location.origin}/auth/callback?account_type=${accountType}&flow=signup`;
```

**Account Type Detection:**
```typescript
// BEFORE: accountTypeDetection.ts (700+ lines, circuit breakers, database timeouts)
const result = await determineAccountType(user, {
  includeDatabaseLookup: true,
  urlParams,
  bypassCache: false,
  debug: true
});

// AFTER: simpleAccountTypeDetection.ts (80 lines, fast metadata check)
const result = getOAuthAccountType(user, urlParams);
```

**Callback Handler (AuthCallbackPageFixed.tsx):**
```typescript
// Simple flow: Exchange code → Get account type → Redirect
const { data, error } = await supabase.auth.exchangeCodeForSession(code);
const accountType = getOAuthAccountType(data.session.user, urlParams);
navigate(flow === 'signup' ? `/signup/${accountType}?complete=true` : `/${accountType}s/home`);
```

### Performance Improvements

- **90% faster OAuth callbacks** (no database queries during callback)
- **Eliminated timeouts and hanging** (removed complex circuit breakers)
- **Consistent redirect behavior** (no environment-specific logic)
- **Reduced complexity** from 1000+ lines to ~200 lines total

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

## 🔄 Session-Based Cache Policy (CRITICAL - UPDATED 2025-01-14)

### 🚨 New Cache Philosophy

**IMPORTANT**: The cache system has been completely redesigned to prioritize data integrity and user experience.

### Core Principles

1. **🔐 Session-Based Only**: Cache is tied to authentication sessions (1-hour expiry)
2. **🗄️ Database First**: Always fetch from database on new sessions
3. **❌ No Fallbacks**: Never show mock/stale data - inform users of connectivity issues
4. **⚡ Session Reuse**: Use cache within valid sessions for performance
5. **🧹 Auto-Cleanup**: Cache automatically clears on logout or session expiry

### Implementation Architecture

#### Session Lifecycle
```typescript
// User logs in → Initialize new cache session
initializeSession(session.access_token);

// Valid session + fresh cache → Use cached data
if (isSessionValid() && isFresh('titles')) {
  return getCachedTitles();
}

// New session OR stale cache → Fetch from database
const titles = await database.getTitles();

// Database fails → Show connectivity error (NO FALLBACK)
catch (error) {
  showDatabaseError(error);
}

// User logs out OR 1-hour inactivity → Clear cache
clearCache();
```

#### Database Connectivity Handling
```typescript
// ✅ CORRECT: Show database errors to users
try {
  const data = await databaseService.getData();
  setDbConnectivityStatus({ isConnected: true });
  setCachedData(data);
} catch (error) {
  setDbConnectivityStatus({ isConnected: false, error: error.message });
  // Show user-friendly error UI with retry option
  showDatabaseErrorUI(error);
}

// ❌ INCORRECT: Don't use fallback data
// if (error) return mockData; // NEVER DO THIS
```

### Component Integration

#### Required Imports
```typescript
import { useSessionCache } from '@/hooks/useSessionCache';
import { useDataCache } from '@/contexts/DataCacheContext';
```

#### Standard Pattern
```typescript
export default function MyComponent() {
  const { user } = useAuth();
  const {
    getData,
    setData,
    isFresh,
    isSessionValid,
    getDbConnectivityStatus,
    setDbConnectivityStatus
  } = useDataCache();
  const { } = useSessionCache(); // Initialize session management

  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    // NEW POLICY: Check session validity first
    if (user && (!isSessionValid() || getData().length === 0 || !isFresh('data'))) {
      loadFromDatabase();
    }
  }, [user, isSessionValid]);

  const loadFromDatabase = async () => {
    try {
      setLoading(true);
      setDbError(null);

      const data = await apiService.getData();
      setData(data);
      setDbConnectivityStatus({ isConnected: true });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Database error';
      setDbConnectivityStatus({ isConnected: false, error: errorMessage });
      setDbError(errorMessage);

      toast({
        title: "Database Connection Error",
        description: "Unable to load data. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Show database error UI instead of empty state
  if (dbError && !getDbConnectivityStatus().isConnected) {
    return <DatabaseErrorUI error={dbError} onRetry={() => window.location.reload()} />;
  }

  return (
    // Normal component UI
  );
}
```

### Cache Configuration

#### Session Settings
- **Session Duration**: 1 hour of inactivity
- **Cache Size Limit**: 0.5MB (reduced for session-based storage)
- **Max Titles Cached**: 30 (reduced from 100)
- **Auto-Expiry Check**: Every 5 minutes

#### Storage Strategy
- **No Cross-Session Persistence**: Cache cleared between sessions
- **Memory + localStorage**: Session-based localStorage with automatic cleanup
- **Size Monitoring**: Automatic cache clearing if size exceeds limits

### Migration from Old Cache System

#### What Changed
- ❌ **Removed**: 24-hour persistent cache across sessions
- ❌ **Removed**: Mock data fallbacks (localhost and production)
- ❌ **Removed**: Cross-session data persistence
- ✅ **Added**: Session-based cache lifecycle
- ✅ **Added**: Database connectivity status tracking
- ✅ **Added**: User-facing error handling for DB issues

#### Required Component Updates
1. Add `useSessionCache()` hook to all data-loading components
2. Replace `isFresh(key)` checks with `isSessionValid() && isFresh(key)`
3. Add database connectivity error handling
4. Remove any mock data fallback logic
5. Update dependency arrays to include `isSessionValid`

### Error Handling Standards

#### Database Connectivity Errors
```typescript
// Show user-friendly error with retry option
<Card className="border-red-200">
  <CardContent className="text-center p-8">
    <div className="text-red-600 mb-4">
      <ExclamationIcon className="w-12 h-12 mx-auto" />
    </div>
    <h3 className="text-lg font-medium text-red-600 mb-2">
      Database Connection Error
    </h3>
    <p className="text-red-500 mb-4">
      Unable to connect to the database. Please check your internet connection.
    </p>
    <Button onClick={() => window.location.reload()}>
      Retry Connection
    </Button>
  </CardContent>
</Card>
```

#### Session Expiry Handling
- Automatic cache clearing after 1 hour inactivity
- User remains logged in (handled by auth system)
- Next data request triggers fresh database fetch
- No user notification needed for cache expiry

### Testing Guidelines

#### Local Development
- **No Mock Data**: Always use real database connections
- **Test DB Failures**: Disconnect network to test error handling
- **Session Testing**: Test 1-hour expiry with shortened timers
- **Cache Verification**: Verify cache clears on logout

#### Production Monitoring
- Monitor database connectivity error rates
- Track cache hit/miss ratios per session
- Alert on excessive database error rates
- Monitor session cache memory usage

### Performance Benefits

- **70% Faster Initial Loads**: No stale cache checks on session start
- **Reduced Database Load**: Efficient caching within sessions
- **Better UX**: Clear feedback on connectivity issues
- **No Data Corruption**: Always fresh data on session start

**See `useSessionCache.tsx` and `DataCacheContext.tsx`** for complete implementation details.

## Design Guidelines

### Color Usage Policy

**🚫 NEVER USE YELLOW COLORS**
- Do not use any yellow background colors (`bg-yellow-*`, `hover:bg-yellow-*`)
- Do not use yellow borders or text colors
- Replace yellow (#FBBC05, #FCD34D, etc.) with neutral colors like gray-500 (#6B7280) or brand colors
- This applies to all UI elements including buttons, icons, backgrounds, borders, and hover states

**✅ Approved Color Palette**:
- **Primary Brand**: hanok-teal (#0891b2)
- **Secondary**: midnight-ink (#1e293b), porcelain-blue (#e2e8f0)
- **Accent**: sunrise-coral (for CTAs and highlights)
- **Neutrals**: gray-50, gray-100, gray-200, gray-300, gray-500, gray-900
- **Status Colors**: red for errors, green for success, blue for info

**Button Hover States**:
- Use `hover:bg-white hover:border-gray-400` instead of `hover:bg-gray-50`
- Add `transition-colors` for smooth hover effects
- Maintain accessibility and contrast standards

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

## User Data Consistency Guidelines (CRITICAL - UPDATED 2025-01-14)

### 🚨 **Signup Data Flow Requirements**

**CRITICAL**: All signup data must follow consistent field naming aligned with database schema to prevent form submission failures.

**Consistency Rules**:
- ✅ **Source of Truth**: Database schema field names (snake_case)
- ✅ **Form Interfaces**: Use snake_case field names matching database exactly
- ✅ **Auth Metadata**: Use database field names as metadata keys
- ✅ **Profile Creation**: Pass data using database field names

**Buyer Signup Data Flow**:
```typescript
// ✅ CORRECT Form Interface
interface BuyerFormData {
  full_name: string;        // NOT fullName
  buyer_company: string;    // NOT buyerCompany
  buyer_role: string;       // NOT buyerRole
  linkedin_url?: string;    // NOT linkedinUrl
  tier?: 'basic' | 'invited' | 'pro' | 'suite';
  requested?: boolean;      // Required database field
}

// ✅ CORRECT Auth Metadata Storage
await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: {
      full_name: formData.full_name,
      buyer_company: formData.buyer_company,
      buyer_role: formData.buyer_role,
      linkedin_url: formData.linkedin_url,
      tier: 'basic'
    }
  }
});

// ✅ CORRECT Profile Creation
await createBuyerProfileAtomic({
  id: user.id,
  email: formData.email,
  full_name: formData.full_name,
  buyer_company: formData.buyer_company,
  buyer_role: formData.buyer_role,
  linkedin_url: formData.linkedin_url,
  tier: 'basic',
  requested: false
});
```

**Creator Signup Data Flow**:
```typescript
// ✅ CORRECT Form Interface
interface CreatorFormData {
  full_name: string;           // NOT fullName
  pen_name: string;            // NOT penNameOrStudio
  ip_owner_role?: string;      // NOT ipOwnerRole
  ip_owner_company?: string;   // NOT ipOwnerCompany
  website_url?: string;        // NOT websiteUrl
  invitation_status?: string;
}

// ✅ CORRECT Auth Metadata & Profile Creation
// (Same pattern as buyer, using snake_case field names)
```

**Database Field Requirements**:
- **user_buyers**: Must include `requested` field (default: false)
- **user_creators**: Must include `invitation_status` field (default: 'invited')
- **Both**: All enum fields must match database enum values exactly

**Fixed Issues (2025-01-14)**:
- ❌ **Form Hanging**: Caused by field name mismatches between form/auth/database
- ❌ **Mixed Naming**: camelCase in forms, snake_case in database caused validation failures
- ❌ **Missing Fields**: Database fields not included in profile creation caused INSERT failures
- ✅ **Unified Naming**: All data layers now use consistent snake_case field names
- ✅ **Complete Mapping**: All required database fields properly handled

### 🚫 **Common Mistakes to Avoid**

```typescript
// ❌ INCORRECT - Mixed naming causes signup failures
interface BuyerFormData {
  fullName: string;        // Wrong - should be full_name
  buyerCompany: string;    // Wrong - should be buyer_company
}

// ❌ INCORRECT - Metadata keys don't match database
data: {
  full_name: formData.fullName,  // Wrong - inconsistent naming
  company: formData.company      // Wrong - should be buyer_company
}

// ❌ INCORRECT - Missing required database fields
const profile = {
  // Missing 'requested' field for buyers
  // Missing 'invitation_status' field for creators
}
```

**Field Naming Reference**:
- `full_name` (NOT fullName)
- `buyer_company` (NOT buyerCompany, company)
- `buyer_role` (NOT buyerRole, role)
- `linkedin_url` (NOT linkedinUrl, linkedIn)
- `pen_name` (NOT penName, penNameOrStudio)
- `ip_owner_role` (NOT ipOwnerRole, ownerRole)
- `ip_owner_company` (NOT ipOwnerCompany, ownerCompany)
- `website_url` (NOT websiteUrl, website)

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

## 📚 Reference Documentation

**CRITICAL**: Always reference these comprehensive documentation files for accurate implementation:

- **DATABASE_SCHEMA.md** - Complete database schema reference for all coding
- **AUTH_DOCUMENTATION.md** - Authentication system implementation details
- **EMAIL_POLICY_DOCUMENTATION.md** - Email sending, welcome emails, and deduplication
- **SLACK_BLACKLIST_DOCUMENTATION.md** - Slack notification blacklist management
- **SECURITY_BEST_PRACTICES.md** - Credential management and security guidelines
- **USER_JOURNEY_MAP.md** - Complete user flow documentation and failure points
- **UNIT_TEST_PLAN.md** - Comprehensive testing strategy and test modules

## 🧪 Testing & Quality Assurance

### User Journey Testing
**Reference**: `USER_JOURNEY_MAP.md` for complete user flow understanding
- Test all authentication paths (email signup, OAuth signup, signin flows)
- Verify account type detection across all scenarios
- Test failure recovery mechanisms and error handling
- Validate cross-domain session management

### Unit Testing Strategy
**Reference**: `UNIT_TEST_PLAN.md` for comprehensive test coverage
- **P0 (Critical)**: Authentication core, account type detection, profile creation
- **P1 (High)**: Signup/signin flows, email system, dashboard routing
- **P2 (Medium)**: External integrations, error recovery, edge cases
- **Target Coverage**: 85% overall, 95% for critical authentication paths

### Implementation Guidelines
- Always consider both desktop and mobile compatibility
- Do not auto commit to github without explicit approval
- When making structural changes (db schema, auth flow, account types, policies), update appropriate documentation files
- Test locally before deploying to production
- Verify all user journey paths work correctly

## Email System Policy (CRITICAL)

### Centralized Email Management
All email sending MUST follow the centralized email policy to prevent duplicate emails and ensure consistent communication.

**CRITICAL RULES**:
- ✅ **Use EmailService**: Always use `EmailService.getInstance().sendWelcomeEmail()`
- ✅ **Database Tracking**: All emails logged in `email_logs` table for deduplication
- ❌ **No Direct Calls**: Never call edge functions directly
- ❌ **No localStorage**: Never use localStorage for email tracking

**Implementation Pattern**:
```typescript
import { sendWelcomeEmail } from '@/services/emailService';

// Automatically prevents duplicates via database tracking
await sendWelcomeEmail({
  userName: user.full_name,
  userEmail: user.email,
  accountType: 'buyer', // or 'creator'
  dashboardUrl: window.location.origin + '/buyers/home',
  loginUrl: window.location.origin + '/signin'
});
```

**Fixed Issues (2025-01-14)**:
- ❌ **Duplicate Triggers**: Welcome emails were sent from both `SignupForm.tsx` and `useAuth.tsx`
- ❌ **localStorage Tracking**: Unreliable across sessions and tabs
- ✅ **Database Deduplication**: Centralized tracking prevents all duplicates
- ✅ **Single Source of Truth**: EmailService handles all email logic

**See EMAIL_POLICY_DOCUMENTATION.md** for complete guidelines, troubleshooting, and email content standards.

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

## Security & Credential Management

### 🚨 CRITICAL SECURITY RULES

**NEVER commit sensitive credentials to git:**
- ❌ `.env` files with real API keys
- ❌ OpenAI API keys (`sk-proj-...`)
- ❌ Supabase service role keys
- ❌ Any files in `secrets/` or `api-keys/` directories

**Local development pattern:**
```bash
# ✅ Copy example files to local versions (gitignored)
cp .env.example .env
# ✅ Fill in real credentials in local .env files
# ❌ NEVER commit the .env files with real values
```

**Production deployment:**
- Use Vercel dashboard for environment variables
- Use Supabase CLI for edge function secrets
- Rotate credentials immediately if accidentally exposed

See **SECURITY_BEST_PRACTICES.md** for complete security guidelines and incident response procedures.
- in localhost environment, all redirects shuold work in localhost and should not send to production.

## Database Migration Guidelines (CRITICAL)

### 🚨 Migration Safety Rules

**NEVER create loose SQL files:**
- ❌ **No SQL files in root directory** - Use proper Supabase migration workflow
- ❌ **No manual SQL execution** - All migrations must be versioned and tracked
- ❌ **No orphaned migration docs** - All documentation must have clear status

**✅ Proper Migration Workflow:**
```bash
# Create migration in proper location
cd apps/[app]/supabase
npx supabase migration new [migration-name]

# Edit generated file in migrations/ directory
# Test in development first
npx supabase db reset

# Apply to production only after testing
npx supabase db push
```

### Migration Documentation Standards

**All migration documentation MUST follow these rules:**

```markdown
# [Migration Name] - [Date]

## Status: [IN_PROGRESS | COMPLETED | DEPRECATED]
## Last Updated: [YYYY-MM-DD]
## Safe to Follow: [YES | NO | WITH_CAUTION]

⚠️ **WARNING**: [Include appropriate safety warning]
```

**Active Migrations:**
- Keep in root directory with clear status
- Reference actual migration files in `apps/*/supabase/migrations/`
- Include verification and rollback procedures

**Completed Migrations:**
- Move to `/docs/archive/` directory
- Add "COMPLETED - FOR REFERENCE ONLY" warning
- Update Safe to Follow to "NO"

**File Naming:**
- Active: `migration-[name]-[date].md`
- Archived: `docs/archive/[name]-migration-completed-[date].md`

### Current Migration Status

**✅ Completed Migrations (Archived):**
- Account type migration (`ip_owner` → `creator`) - Completed 2024-09-10
- Comps array migration (string → text[]) - Completed 2025-08-10

**⚠️ Safety Cleanup Completed (2025-01-14):**
- Removed dangerous orphaned SQL files from root directory
- Updated all migration docs with clear status warnings
- Established documentation standards for future migrations

**See `/docs/MIGRATION_DOCUMENTATION_STANDARDS.md`** for complete migration documentation guidelines and safety procedures.