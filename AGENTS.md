# Repository Guidelines

## Project Structure & Module Organization
- Root `package.json` manages npm workspaces for `apps/*` and `packages/*`. The Vite + React apps (`apps/dashboard`, `apps/website`, `apps/admin`) keep feature code in `src/{components,pages,utils}`.
- Shared libraries live in `packages`: `ui` (component system), `api-client` (Supabase wrappers), `auth`, `utils`, `build-config` (ESLint/TS presets), and `testing` (Vitest/Jest helpers).
- Supporting services live outside the workspaces: `backend/` (Express scraper API), `api-server/` (local Supabase proxy), plus app-specific SQL/scripts in directories such as `apps/dashboard/migrations-fix` or `supabase/`.

## Build, Test, and Development Commands
- Bootstrap with `npm install` at the repo root; run `npm install` inside `backend/` or `api-server/` for their local dependencies.
- Developer servers: `npm run dev:dashboard`, `npm run dev:website`, `npm run dev:admin`, and `npm run dev` within `backend/` when scraper endpoints are required.
- Key checks: `npm run build:all`, `npm run build:packages`, `npm run lint:all`, `npm run test:all`, `npm run test:coverage`, and `npm run storybook` for the design system.

## Coding Style & Naming Conventions
- TypeScript, ES modules, and 2-space indentation are standard. Prefer `const` and reuse `@kstorybridge/ui` primitives before introducing custom Tailwind markup.
- Component files use PascalCase, hooks use the `useCamelCase` prefix, and utilities should remain kebab-case (`src/utils/fetch-supabase.ts`). Align database field names with `FIELD_NAMING_STANDARDS.md`, and rely on root ESLint rules via `npm run lint --workspace=<app>`.

## Testing Guidelines
- Vitest + Testing Library cover unit and component tests in `src/__tests__`; run targeted suites with `npm run test --workspace=apps/dashboard -- --run` and maintain coverage with `npm run test:coverage`.
- Integration and troubleshooting scripts ship as `test-*.js` at each app root for Supabase, OAuth, and scraper checks.
- Shared mocks live in `packages/testing`; rebuild with `npm run build --workspace=packages/testing`, and validate scrapers through `npm run test-scraper` inside `backend/` using fixtures in `backend/test-data/`.

## Commit & Pull Request Guidelines
- Follow the existing emoji-prefixed, imperative commit style (`🔧 Adjust OAuth redirect`, `🐛 Guard null profiles`). Keep each commit focused on one change set.
- PRs must call out the affected app or package, link the tracking issue, attach screenshots or CLI output for functional updates, and list the commands you ran. Flag security-sensitive diffs (Supabase policies or SQL migrations) for review.

## Environment & Security
- Copy `.env.local` or `.env.testing` templates that live beside each app and never commit secrets; store long-lived keys outside the repo.
- Coordinate schema work through `apps/dashboard/supabase/` change notes and keep `DATABASE_SCHEMA.md` updated whenever you touch migrations or access policies.
