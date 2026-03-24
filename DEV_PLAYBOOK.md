# KStoryBridge Dev Playbook
> **Read this before planning or executing ANY coding task.**
> Last updated: 2026-03-21

---

## 1. Monorepo Structure — Who Owns What

```
apps/
  dashboard/   → dashboard.kstorybridge.com  (port 8081)  Buyer-facing features
  creator/     → creator.kstorybridge.com    (port 8083)  Creator-facing features
  website/     → kstorybridge.com            (port 5173)  Marketing site ONLY
  dashboard-legacy/  → ARCHIVED. Do not touch.

packages/
  api-client/      Supabase wrapper (shared)
  auth/            Auth utilities (shared)
  ui/              shadcn/ui components (shared)
  tools/           AI tools: Comps Generator, Format Fit, OMDB
  design-system/   Design tokens
  utils/           Common helpers
```

### The golden rule for app ownership
| Feature type | Lives in |
|---|---|
| Producer-facing product features (title pages, search, comps, mandates) | `apps/dashboard` |
| Creator-facing features (title submission, profiles) | `apps/creator` |
| Marketing, SEO, static content | `apps/website` |
| **Never:** DB-heavy dynamic pages | `apps/website` |
| **Never:** Business logic / product features | `apps/website` |

**Why:** The website was designed as a static/minimal-DB app. Adding dynamic DB-fetching pages there creates architectural debt. All product pages belong on the dashboard or creator app.

---

## 2. Architectural Decisions (locked)

### Title detail pages → dashboard app
**Decision (2026-03-21):** Public title detail pages live at `dashboard.kstorybridge.com/titles/:slug`
- New public route in `apps/dashboard/src/App.tsx`: `/titles/:slug` — NO auth guard
- Auth-aware rendering: anonymous sees gated/blurred content, logged-in sees full analysis
- `apps/website` `/titles/:slug` redirects to dashboard URL (301 equivalent via React Router Navigate)
- **Do NOT** re-add a full title detail page to `apps/website`

### Website stays static
The website fetches from `public_titles` (anon-safe view) only for lightweight listing pages. It does NOT fetch from `titles`, `title_format_fit`, or any authenticated table.

---

## 3. Data Layer Rules

### Two tiers of title data

| Source | Who can query | What it contains | Use for |
|---|---|---|---|
| `public_titles` (view) | Anonymous + authenticated | Basic metadata: name, slug, image, synopsis, genre, comps (text), views, chapters | Website listing pages, public SEO content |
| `titles` (table) | Authenticated only (RLS) | Everything + `comps_analysis` JSONB, `rights_holder_name`, `rights_holder_company`, `likes` | Dashboard product features, post-login content |
| `title_format_fit` (table) | Authenticated only | Format scores per title | Dashboard format fit section |

### Auth-aware data fetching pattern
```typescript
// Correct pattern in dashboard public pages
const { user, loading: authLoading } = useAuth();
useEffect(() => {
  if (authLoading) return; // wait for auth to resolve before fetching
  if (user) {
    // fetch from titles table (full data)
  } else {
    // fetch from public_titles view (limited data)
  }
}, [slug, authLoading, user]);
```

### Fields NOT in public_titles (as of 2026-03-21)
- `comps_analysis` (JSONB) — authenticated only
- `likes` — authenticated only
- `verified` / `is_verified` — not yet a column anywhere
- `rights_holder_name`, `rights_holder_company` — authenticated only
- `format_fit` scores — in `title_format_fit` table, authenticated only

---

## 4. Auth Patterns

### Dashboard app
- `useAuth()` hook from `apps/dashboard/src/hooks/useAuth.tsx`
- Auth context wraps the entire app
- `ProtectedRoute` component wraps routes that require login
- Public routes (no ProtectedRoute): `/signin`, `/signup`, `/auth/callback`, `/trial`, `/titles/:slug`
- OAuth callback: `${window.location.origin}/auth/callback` — NEVER add URL params

### Website app
- No auth context/hook — uses `supabase.auth.getUser()` directly if needed
- For any feature requiring auth state on the website, use the Supabase client directly

### Creator app
- Same pattern as dashboard, separate auth context

---

## 5. Routing Conventions

### Dashboard routes
| Path | Auth required | Notes |
|---|---|---|
| `/signin`, `/signup`, `/auth/callback` | No | Public auth pages |
| `/trial`, `/trial/titles/:titleId` | No | Free trial flow |
| `/titles/:slug` | No | Public title detail page (auth-aware) |
| `/buyers/*` | Yes (ProtectedRoute) | All buyer product features |
| `/admin/*` | Yes (AdminProtectedRoute) | Admin only |

### Do NOT use titleId for public-facing URLs
- `/buyers/titles/:titleId` — internal dashboard (uses UUID titleId)
- `/titles/:slug` — public-facing (uses human-readable slug)
- Public links always use slug, not UUID

---

## 6. Git Flow & Deployment

```
feature branch → v2 (direct push OK) → main (PR required)
```

| Branch | Deploy target | Auto-deploy? |
|---|---|---|
| `v2` | dashboard-staging.kstorybridge.com, creator-staging.kstorybridge.com | Yes |
| `main` | dashboard.kstorybridge.com, creator.kstorybridge.com, kstorybridge.com | Yes |

**Website staging:** Does not exist — website only deploys from `main`.
**Supabase:** `supabase db push` and `supabase functions deploy` hit **production directly**. No staging DB.

### ⚠️ Deployment Gate — MANDATORY (Ground Rule set 2026-03-21)

**Neo and Claude Code must NEVER push to staging or production without explicit instruction.**

The required flow is:
1. **Develop on localhost** — build and iterate locally, run TypeScript + unit tests
2. **Sungho explicitly says "push to staging"** → push to `v2`, run tests against staging
3. **Sungho explicitly says "push to production" / opens PR** → merge to `main`, run tests in production

**Default behavior: stop at localhost.** Do not push anywhere until told to.

### Feature branch workflow
```bash
git checkout main && git pull
git checkout -b feat/your-feature
# ... develop and test locally ...

# WAIT for Sungho to say "push to staging" before this:
git push origin feat/your-feature:v2

# WAIT for Sungho to open/approve PR before this:
# PR: feat/your-feature → main
```

---

## 7. Before You Write Any Code — Checklist

**Neo must do this before spawning Claude Code. Claude Code must do this at task start.**

- [ ] Read this file
- [ ] Identify which app the change belongs in (dashboard / creator / website)
- [ ] Read the existing page/component being modified — do not assume, read the actual file
- [ ] Check if a similar pattern already exists in the codebase before inventing a new one
- [ ] Confirm the data source: `public_titles` (anon) vs `titles` table (authenticated)
- [ ] Check if the route needs auth guard or should be public
- [ ] Verify git branch state: `git status` and `git log --oneline -5`

---

## 8. Common Mistakes to Avoid

| Mistake | What to do instead |
|---|---|
| Adding dynamic DB pages to `apps/website` | Add to `apps/dashboard` with a public route |
| Using `/buyers/titles/:titleId` URLs in newsletters or public links | Use `/titles/:slug` |
| Fetching from `titles` table on anonymous-accessible pages | Use `public_titles` view, gate the rest |
| Wrapping public routes in `ProtectedRoute` | Place route BEFORE protected route groups in App.tsx |
| Force-pushing to `v2` | `v2` is protected — always fast-forward push |
| Running `supabase db push` thinking it's staging | It's production. Always. |
| Assuming what's in the codebase | Read the file first. The code and the plan may be out of sync. |

---

## 9. Testing

```bash
# TypeScript check (fast, run before every push)
npx tsc --project apps/dashboard/tsconfig.json --noEmit
npx tsc --project apps/website/tsconfig.json --noEmit

# Unit tests (per app)
cd apps/dashboard && npx vitest run
cd apps/website && npx vitest run

# E2E tests (requires apps running locally)
TEST_ENV=localhost npx playwright test tests/
TEST_ENV=staging npx playwright test tests/  # against staging
```

**Note:** `@kstorybridge/title-intelligence` has no tests configured — its test failure is pre-existing and unrelated to product code. Ignore it.

**Note:** E2E tests in `tests/` run against dashboard + creator apps. They will fail locally if those apps aren't started (`npm run dev:dashboard`, `npm run dev:creator`).

---

## 10. Dev Environment (Neo / Remote Execution)

```bash
# SSH to Mac Mini (Tailscale)
ssh sungho@100.95.123.42

# Always prefix commands with PATH
PATH=/opt/homebrew/bin:/usr/local/bin:$PATH

# Claude Code on Mac Mini
/Users/sungho/.local/bin/claude --permission-mode bypassPermissions --print "..."

# Repo location on Mac Mini
/Users/sungho/code/kstorybridge-integrated

# Start dev servers (from repo root on Mac Mini)
npm run dev:dashboard   # localhost:8081
npm run dev:website     # localhost:5173
npm run dev:creator     # localhost:8083
# Access from MacBook over Tailscale: http://100.95.123.42:{port}
```

---

## 11. Key Files Reference

| File | Purpose |
|---|---|
| `CLAUDE.md` | Build commands and architecture overview (Claude Code reads this automatically) |
| `DEV_PLAYBOOK.md` | This file — decisions, rules, patterns |
| `apps/dashboard/src/App.tsx` | All dashboard routes |
| `apps/dashboard/src/components/ProtectedRoute.tsx` | Auth guard component |
| `apps/dashboard/src/hooks/useAuth.tsx` | Auth state hook |
| `apps/dashboard/src/pages/PublicTitleDetailPage.tsx` | Public title detail page (no auth) |
| `apps/website/src/pages/PublicTitlePage.tsx` | Website title listing/preview page |
| `supabase/migrations/` | ALL DB migrations — run `supabase db push` to apply to production |
| `tests/helpers/test-config.ts` | E2E environment URLs |

---

## 12. Agent Orchestration & MD File Policy

### Neo is the Orchestrator (set 2026-03-21)
Neo (@Creepyblues_bot) monitors ALL council topics and chats without exception.
- Neo receives messages in all council topics (Tim/6, Steve/8, Beast/10, Ted/11, Jamie/12) without needing to be tagged
- Neo mediates any conflicts or coordination gaps between agents proactively
- When an agent is silent or unavailable, Neo steps in — but MUST document what was decided in briefing.md immediately
- briefing.md is the single source of truth all agents read before acting

### MD File Ownership
| File | Location | Owner | Purpose |
|---|---|---|---|
| CLAUDE.md | repo root | Sungho | Build commands for Claude Code |
| DEV_PLAYBOOK.md | repo root | Neo + Steve | Dev rules, architecture decisions, patterns |
| briefing.md | council-shared/ | Neo | Cross-agent ground truth — updated after every decision |
| KB research files | raw/kstorybridge/ | Neo (Archie) | Research, specs, reports — one file per topic, no duplicates |

### No Duplicate Files Rule
- One canonical file per topic. Before creating any new MD file, check if one already exists.
- If two agents create conflicting files: Neo reconciles into one, deletes the duplicate, updates briefing.md.
- All significant architectural or product decisions go into BOTH briefing.md (for agents) AND DEV_PLAYBOOK.md (for Claude Code).

### Decision Protocol
1. Product/UX decisions → Steve leads, Neo documents in briefing.md
2. Operations/execution decisions → Neo leads, posts summary in relevant topic
3. When agents conflict: Neo mediates, Sungho has final call
4. After any decision: Neo updates briefing.md within the same session
