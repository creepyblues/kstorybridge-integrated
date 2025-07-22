# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on port 8080
- `npm run build` - Build for production  
- `npm run build:dev` - Build for development mode
- `npm run lint` - Run ESLint on all files
- `npm run preview` - Preview production build locally

## Architecture Overview

This is a React-based dashboard application for KStoryBridge, built with Vite, TypeScript, and shadcn/ui components. The application serves different dashboards based on user account types (buyers vs IP owners).

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui components + Radix UI primitives + Tailwind CSS
- **Backend**: Supabase (authentication, database)
- **State Management**: TanStack React Query + React Context
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation

### Key Architecture Patterns

**Authentication Flow**: 
- Uses Supabase auth with custom AuthProvider context (`src/hooks/useAuth.tsx`)
- ProtectedRoute component wraps authenticated pages
- Account type stored in user metadata determines dashboard type

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