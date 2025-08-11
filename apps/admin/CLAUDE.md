# CLAUDE.md - Admin Portal

This file provides guidance to Claude Code (claude.ai/code) when working with the KStoryBridge Admin Portal.

## Development Commands

### Basic Commands
- `npm run dev` - Start admin development server on port 8082
- `npm run build` - Build for production
- `npm run build:dev` - Build for development mode
- `npm run lint` - Run ESLint on all files
- `npm run preview` - Preview production build locally

### Data Generation Scripts
- `npm run generate:taglines` - Generate taglines for all titles without them
- `npm run generate:taglines:dry-run` - Test tagline generation without database changes
- `npm run generate:taglines:limit` - Process limited number of titles (--limit=N)

### Monorepo Commands (from root)
- `npm run dev:admin` - Start admin app from monorepo root
- `npm run build:admin` - Build admin app from monorepo root
- `npm run lint:all` - Run linting on all applications

## Architecture Overview

This is the KStoryBridge Admin Portal - a separate React TypeScript application for administrative access to manage titles and content. It provides a secure, isolated interface for authorized personnel only.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui components + Radix UI primitives + Tailwind CSS
- **Backend**: Supabase (shared database with dashboard/website)
- **Authentication**: Custom admin authentication with dedicated admin table
- **Routing**: React Router v6
- **Port**: 8082 (different from dashboard:8081 and website:5173)

### Key Features
- **Isolated Authentication**: Uses dedicated `admin` table for access control
- **No Redirect Loops**: Completely separate authentication flow from website/dashboard
- **Minimal Navigation**: Only "Titles" section in navigation (as requested)
- **Same Design Language**: Matches dashboard design aesthetic
- **Secure Access**: Admin-only access with email verification against admin table

### Admin Table Structure
```sql
CREATE TABLE public.admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  active BOOLEAN DEFAULT true
);
```

### Authentication Flow
1. User visits admin.kstorybridge.com
2. If not authenticated, redirected to `/login`
3. Login form validates credentials via Supabase Auth
4. After successful auth, checks if user email exists in `admin` table
5. If admin record exists and is active, grants access
6. If no admin record or inactive, denies access
7. Authenticated admin users can access `/titles`

### Project Structure
```
apps/admin/
├── src/
│   ├── components/
│   │   ├── layout/           # AdminHeader, AdminSidebar, AdminLayout
│   │   ├── ui/              # shadcn/ui components
│   │   └── ProtectedRoute.tsx
│   ├── hooks/
│   │   └── useAdminAuth.tsx  # Admin authentication hook
│   ├── pages/
│   │   ├── AdminLogin.tsx    # Secure login page
│   │   └── AdminTitles.tsx   # Titles management page
│   ├── services/
│   │   ├── titlesService.ts  # Title data operations
│   │   └── featuredService.ts # Featured titles
│   ├── integrations/supabase/
│   │   ├── client.ts         # Supabase client
│   │   └── types.ts          # Database types including admin table
│   └── App.tsx              # Main app with routing
├── supabase/
│   ├── migrations/
│   │   └── 20250801120000-create-admin-table.sql
│   └── config.toml
└── package.json
```

### Navigation Structure
- **Header**: Logo, admin name, sign out button
- **Sidebar**: Only "Titles" navigation item (as requested)
- **Main Content**: Full titles management interface

### Security Features
- **Email Verification**: Only emails in admin table can access
- **Active Status**: Admin records can be deactivated
- **Row Level Security**: Enabled on admin table
- **No Cross-Domain Issues**: Completely isolated from other apps

### Design Consistency
- Uses same color scheme as dashboard (hanok-teal, midnight-ink, porcelain-blue)
- Same typography and spacing patterns
- Consistent card designs and layouts
- Same shadcn/ui component library

### Database Access
- Shares same Supabase project with dashboard/website
- Uses same titles, profiles, user_favorites tables
- Adds new `admin` table for access control
- Same database types and service patterns

### Development Workflow
1. Start admin server: `npm run dev:admin` (from monorepo root)
2. Access via http://localhost:8082
3. Login with admin credentials
4. Manage titles through admin interface

### Deployment
- Intended for admin.kstorybridge.com subdomain
- Separate deployment from dashboard and website
- Requires admin table to be populated with authorized users

### Admin Management
To add new admin users, insert records into the admin table:
```sql
INSERT INTO public.admin (email, full_name) 
VALUES ('new-admin@kstorybridge.com', 'Admin Name');
```

## Database Schema & Common Tasks

### Titles Table Structure
The `titles` table contains all fields for title management. **Always show ALL fields** when requested:

**Core Fields:**
- `title_id` (UUID, Primary Key)
- `title_name_kr` (Korean title, required)
- `title_name_en` (English title, optional)
- `description` (Main content description)
- `synopsis` (Brief synopsis)
- `tagline` (Marketing tagline)
- `note` (Internal notes)

**Author/Creator Fields:**
- `author` (Original author)
- `story_author` (Story writer)
- `art_author` (Artist)
- `writer` (Script writer)
- `illustrator` (Illustrator)
- `rights` (Rights information)
- `rights_owner` (Rights owner - different from rights)
- `creator_id` (Creator UUID reference)

**Content Details:**
- `genre` (Enum type)
- `content_format` (Enum type)
- `chapters` (Number)
- `completed` (Boolean or null)
- `tags` (String array)

**Media & Links:**
- `title_image` (Cover image URL)
- `title_url` (Original content URL)
- `pitch` (Pitch document URL)

**Metrics:**
- `views` (View count)
- `likes` (Like count)
- `rating` (Average rating)
- `rating_count` (Number of ratings)

**Market Information:**
- `perfect_for` (Target market description)
- `comps` (Comparable titles - array)
- `tone` (Content tone)
- `audience` (Target audience)

**System Fields:**
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### User Management Tables

**Admin Table:**
- `id`, `email`, `full_name`, `active`, `created_at`, `updated_at`
- Used for admin authentication and access control

**User Tables (Shared with Dashboard/Website):**
- `user_buyers` - Buyer user accounts with `tier` field
- `user_ipowners` - Creator/IP owner accounts
- `profiles` - Legacy user profile data

### Common Development Patterns

**1. Database Queries:**
- Always use `email` field for user lookups (NOT `user_id` - doesn't exist)
- Query patterns: `supabase.from('table').select('fields').eq('email', email)`
- Handle null/undefined values appropriately

**2. Field Display:**
- When showing "all data" from titles table, include ALL 27+ fields
- Organize fields logically: Basic Info → Authors → Content → Market → System
- Handle array fields (tags, comps) with proper display
- Show null values as "Not specified" or similar

**3. Form Handling:**
- Use proper input types (number, textarea, select)
- Handle array fields with comma-separated input
- Validate required fields before submission
- Show confirmation dialogs for data changes

**4. Error Handling:**
- Always include try/catch blocks for database operations
- Display user-friendly error messages
- Log detailed errors to console for debugging
- Handle network failures gracefully

### Data Generation & Automation

**Tagline Generation:**
- Script: `scripts/data_generator_tagline.js`
- Uses AI (OpenAI) when available, fallback to text processing
- Generates 10-60 character marketing taglines from descriptions
- Configurable with dry-run and limit options

**Script Development Guidelines:**
- Always include dry-run mode for testing
- Add comprehensive logging with emojis for readability
- Handle both AI and fallback methods
- Include error handling and summary statistics
- Use environment variables for API keys

### Supabase Configuration
```typescript
// Standard configuration used across admin app
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA'
```

### Code Style & Standards

**Component Structure:**
- Use functional components with hooks
- Organize imports: React → UI Components → Services → Utils
- Use TypeScript interfaces for prop types
- Follow existing naming conventions

**File Organization:**
- Pages: `/src/pages/Admin*.tsx`
- Components: `/src/components/`
- Services: `/src/services/`
- Scripts: `/scripts/`
- Types: `/src/integrations/supabase/types.ts` (auto-generated)

**UI Consistency:**
- Use shadcn/ui components consistently
- Follow established color scheme: hanok-teal, midnight-ink, porcelain-blue
- Maintain card-based layouts
- Include loading states and error handling

### Testing & Quality Assurance

**Build Verification:**
- Always run `npm run build` after significant changes
- Check for TypeScript errors and warnings
- Verify all imports resolve correctly

**Data Validation:**
- Test database operations with small datasets first
- Use dry-run modes for destructive operations
- Validate data integrity after bulk operations

**Page Functionality:**
- Test all CRUD operations on title pages
- Verify field display and editing capabilities
- Check responsive design and accessibility

### Common Issues & Solutions

**Database Schema:**
- Field names may differ between display and database
- Handle both `rights` and `rights_owner` as separate fields
- Array fields need special handling in forms

**Authentication:**
- Admin table email must match Supabase auth email
- No cross-domain authentication with other apps
- Handle session persistence properly

**Dependencies:**
- Keep OpenAI and other external APIs optional
- Provide fallback methods for all automated features
- Handle rate limiting and API errors gracefully

### Important Notes
- **No Redirect Loops**: Completely separate authentication system
- **Minimal Interface**: Only titles management (no deals, favorites, etc.)
- **Admin Only**: Not accessible to regular users
- **Secure by Default**: Requires explicit admin table entry
- **Consistent Design**: Matches dashboard aesthetic exactly
- **Isolated Operation**: No dependencies on website/dashboard authentication
- **Data Completeness**: Always display ALL available fields when showing title data
- **Error Resilience**: Handle database errors and missing fields gracefully