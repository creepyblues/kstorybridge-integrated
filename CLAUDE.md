# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Commands

### Root Level Commands
- `npm run dev:dashboard` - Start dashboard development server
- `npm run dev:website` - Start website development server  
- `npm run build:dashboard` - Build dashboard for production
- `npm run build:website` - Build website for production
- `npm run build:all` - Build both applications
- `npm run lint:all` - Run linting on both applications
- `npm install` - Install all workspace dependencies

### Individual Application Commands
Run these from within `apps/dashboard/` or `apps/website/`:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## Architecture Overview

This is a monorepo containing two related React TypeScript applications for KStoryBridge - a platform connecting Korean content creators with global media buyers.

### Project Structure
```
├── apps/
│   ├── dashboard/     # Admin dashboard for authenticated users
│   └── website/       # Marketing website and authentication
├── packages/          # Shared libraries (currently empty)
└── node_modules/      # Workspace dependencies
```

### Shared Technology Stack
Both applications share similar technology stacks:
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

### Authentication & User Flow
1. Users sign up on **Website** (`kstorybridge.com`)
2. Different signup flows for Buyers vs IP Owners/Creators
3. After authentication, users access **Dashboard** (`dashboard.kstorybridge.com`)
4. Dashboard shows different interfaces based on `account_type` in user profile

### Shared Components
Both applications use shadcn/ui component library with identical components in `src/components/ui/`. These are auto-generated and should not be manually edited.

### Development Workflow
1. Install dependencies at root: `npm install`
2. Develop applications independently using workspace commands
3. Both apps can run simultaneously on different ports
4. Shared Supabase backend ensures data consistency

## Important Notes

- **Database Types**: Auto-generated, do not edit manually
- **UI Components**: shadcn/ui components in `ui/` folders are generated, avoid direct edits  
- **Supabase Config**: Both apps share same project ID but have separate migration folders
- **Environment**: No custom environment configuration detected - apps likely use default Supabase settings
- **Testing**: No test frameworks detected in package.json files
- **Linting**: ESLint configured with unused variables disabled in both applications

The existing individual CLAUDE.md files in each application provide detailed app-specific guidance and should be consulted for application-specific development tasks.