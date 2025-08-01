# CLAUDE.md - Admin Portal

This file provides guidance to Claude Code (claude.ai/code) when working with the KStoryBridge Admin Portal.

## Development Commands

- `npm run dev` - Start admin development server on port 8082
- `npm run build` - Build for production
- `npm run build:dev` - Build for development mode
- `npm run lint` - Run ESLint on all files
- `npm run preview` - Preview production build locally

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

### Important Notes
- **No Redirect Loops**: Completely separate authentication system
- **Minimal Interface**: Only titles management (no deals, favorites, etc.)
- **Admin Only**: Not accessible to regular users
- **Secure by Default**: Requires explicit admin table entry
- **Consistent Design**: Matches dashboard aesthetic exactly
- **Isolated Operation**: No dependencies on website/dashboard authentication