# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Development Workflow

1. Install dependencies: `npm i`
2. Start development server: `npm run dev`
3. Make changes and test locally
4. Run linting: `npm run lint`
5. Build for production: `npm run build`

The project is connected to Lovable for collaborative development, but can be developed locally using standard Node.js tools.