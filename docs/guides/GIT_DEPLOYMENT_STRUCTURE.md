# Git Deployment Structure - KStoryBridge

**Last Updated**: 2025-10-22
**Repository**: https://github.com/creepyblues/kstorybridge-integrated

## Overview

This document provides a comprehensive reference for the KStoryBridge Git deployment configuration, including repository structure, branch strategy, Vercel integration, and deployment workflows.

---

## Repository Structure

### Git Repository
- **Name**: `kstorybridge-integrated`
- **Type**: Monorepo (npm workspaces)
- **Remote**: `https://github.com/creepyblues/kstorybridge-integrated`
- **Primary Working Directory**: `/Users/sungholee/code/kstorybridge`

### Archive Directories (Reference Only)
- `/Users/sungholee/code/kstorybridge-v2/` - Archive of v2 branch state
- `/Users/sungholee/code/kstorybridge-monorepo/` - Archive of main branch state

**Note**: Active development happens ONLY in `/Users/sungholee/code/kstorybridge`

---

## Branch Strategy

### Two-Branch Deployment Model

| Branch | Purpose | Deploys To | Status |
|--------|---------|------------|--------|
| **v2** | Staging/Development | dashboard-staging, creator-v2-staging | Active development branch |
| **main** | Production | All apps (dashboard, creator-v2, website) | Stable production code |

### Branch Workflow

```
Development Cycle:
1. Work on v2 branch (primary working branch)
2. Push to v2 → Auto-deploy to staging environments
3. Test on staging.kstorybridge.com (dashboard V1) and creator-v2.kstorybridge.com (creator-v2)
4. When stable: Merge v2 → main
5. Push to main → Auto-deploy to production
```

### Critical Rules
- ✅ **Always develop on `v2` branch**
- ✅ **Test on staging before merging to main**
- ✅ **Merge v2 → main only when staging is stable**
- ❌ **Never commit directly to main** (except hotfixes)
- ❌ **Never force push to main**

---

## Vercel Deployment Architecture

### Vercel Projects Overview

KStoryBridge uses **5 separate Vercel projects** for deploying 3 apps across 2 environments:

| Vercel Project         | App | Environment | Domain | Builds From |
|------------------------|-----|-------------|--------|-------------|
| **dashboard-staging**  | Dashboard V1 | Staging | staging.kstorybridge.com | `v2` branch |
| **creator-v2-staging** | Creator V2 | Staging | creator-v2.kstorybridge.com | `v2` branch |
| **kstorybridge-dashboard** | Dashboard V1 | Production | dashboard.kstorybridge.com | `main` branch |
| **kstorybridge-creator** | Creator V2 | Production | creator.kstorybridge.com | `main` branch |
| **kstorybridge-website** | Website | Production | kstorybridge.com | `main` branch |

### Project Configuration

#### 1. dashboard-staging (Staging Environment)

**Purpose**: Testing ground for all dashboard changes before production

**Configuration**:
```yaml
Project Name: dashboard-staging
Production Branch: v2
Root Directory: apps/dashboard
Ignored Build Step: (empty - builds all v2 commits)
Custom Domain: staging.kstorybridge.com
```

**Environment Variables** (Key Settings):
```env
VITE_DASHBOARD_URL=https://staging.kstorybridge.com
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_DEBUG_MODE=true
VITE_OPENAI_ENABLED=true
```

**Deployment Trigger**:
- Builds on EVERY push to `v2` branch
- Auto-deploys to staging domain

---

#### 2. creator-v2-staging (Creator V2 Staging Environment)

**Purpose**: Testing ground for all creator-v2 changes before production

**Configuration**:
```yaml
Project Name: creator-v2-staging
Production Branch: v2
Root Directory: apps/creator-v2
Ignored Build Step: (empty - builds all v2 commits)
Custom Domain: creator-v2.kstorybridge.com
```

**Environment Variables** (Key Settings):
```env
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
VITE_AUTH_DEBUG=true
```

**Deployment Trigger**:
- Builds on EVERY push to `v2` branch
- Auto-deploys to staging domain

---

#### 3. kstorybridge-dashboard (Production Dashboard)

**Purpose**: Production dashboard for buyers (AI chatbot, tier system, premium content)

**Configuration**:
```yaml
Project Name: kstorybridge-dashboard
Production Branch: main
Root Directory: apps/dashboard
Ignored Build Step: if [ "$VERCEL_GIT_COMMIT_REF" = "v2" ]; then exit 0; else exit 1; fi
Custom Domain: dashboard.kstorybridge.com
```

**Ignored Build Step Explained**:
- If branch is `v2` → exit 0 (skip build)
- If branch is `main` → exit 1 (proceed with build)
- **Result**: Only builds when pushing to `main`, skips `v2` pushes

**Environment Variables**:
```env
VITE_DASHBOARD_URL=https://dashboard.kstorybridge.com
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_DEBUG_MODE=false
VITE_OPENAI_ENABLED=true
```

---

#### 4. kstorybridge-creator (Production Creator V2 App)

**Purpose**: Production creator dashboard (content management, pitch uploads, analytics)

**Configuration**:
```yaml
Project Name: kstorybridge-creator
Production Branch: main
Root Directory: apps/creator-v2
Ignored Build Step: if [ "$VERCEL_GIT_COMMIT_REF" = "v2" ]; then exit 0; else exit 1; fi
Custom Domain: creator.kstorybridge.com
```

**Status**: ✅ Deployed to Production (October 2025)

**Notes**:
- Independent authentication system
- Clean rebuild from scratch (no dashboard dependencies)
- Future: Dedicated OAuth callbacks at creator.kstorybridge.com
- See `docs/CREATOR_APP_QUICK_REFERENCE.md` for migration status

---

#### 5. kstorybridge-website (Production Website)

**Purpose**: Marketing website with authentication redirects

**Configuration**:
```yaml
Project Name: kstorybridge-website
Production Branch: main
Root Directory: apps/website
Ignored Build Step: if [ "$VERCEL_GIT_COMMIT_REF" = "v2" ]; then exit 0; else exit 1; fi
Custom Domain: kstorybridge.com
```

**Environment Variables**:
```env
VITE_WEBSITE_URL=https://kstorybridge.com
VITE_DASHBOARD_URL=https://dashboard.kstorybridge.com
VITE_CREATOR_URL=https://creator.kstorybridge.com
```

---

## Vercel.json Configurations

### Critical Rewrite Rules

All apps use SPA (Single Page Application) rewrite rules with **static asset exclusions** to prevent module loading errors.

#### Dashboard & Creator (`apps/dashboard/vercel.json`, `apps/creator/vercel.json`)

```json
{
  "rewrites": [
    {
      "source": "/((?!api|assets|js|docs).*)",
      "destination": "/index.html"
    }
  ],
  "functions": {
    "api/openai-chat.ts": { "maxDuration": 30 },
    "api/health.ts": { "maxDuration": 10 },
    "api/embeddings.js": { "maxDuration": 30 }
  }
}
```

**Exclusions Explained**:
- `api/*` - API routes (not rewritten)
- `assets/*` - JavaScript bundles, CSS (served directly)
- `js/*` - PDF.js workers, external scripts (served directly)
- `docs/*` - Markdown documentation files (served directly)

**Why This Matters**:
- Without exclusions: Vite-generated JS files return HTML → module loading errors
- With exclusions: JS files served correctly → smooth navigation

#### Website (`apps/website/vercel.json`)

```json
{
  "rewrites": [
    {
      "source": "/((?!assets|js|docs).*)",
      "destination": "/index.html"
    }
  ]
}
```

**Difference**: No API routes (website is frontend-only)

---

## Deployment Workflow

### 1. Development on v2 Branch

```bash
# Ensure you're on v2 branch
git checkout v2

# Make changes
# ... edit files ...

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push to trigger staging deployment
git push origin v2
```

**What Happens**:
1. GitHub receives push to `v2` branch
2. Vercel webhook triggered for all 5 projects
3. **dashboard-staging**: Builds and deploys (production branch = v2)
4. **creator-v2-staging**: Builds and deploys (production branch = v2)
5. **kstorybridge-dashboard**: Skips build (ignored build step)
6. **kstorybridge-creator**: Skips build (ignored build step)
7. **kstorybridge-website**: Skips build (ignored build step)

**Result**: Only staging environments update (dashboard V1 + creator-v2)

---

### 2. Testing on Staging

**Staging URL**: https://staging.kstorybridge.com

**Testing Checklist**:
- [ ] Authentication works (signin/signup)
- [ ] OAuth callbacks complete successfully
- [ ] Navigation between pages works
- [ ] No "Failed to fetch module" errors in console
- [ ] Database queries execute correctly
- [ ] AI chatbot responds (if applicable)
- [ ] Pitch deck uploads work
- [ ] Tier-gated content displays correctly

**Debug Tools**:
- `VITE_DEBUG_MODE=true` enables verbose logging
- Browser console shows detailed auth flow
- Network tab shows API calls and static assets

---

### 3. Merging to Production (main)

**Only proceed if staging tests pass 100%**

```bash
# Switch to main branch
git checkout main

# Pull latest changes (in case of team updates)
git pull origin main

# Merge v2 into main
git merge v2

# Review changes
git log --oneline -5

# Push to production
git push origin main
```

**What Happens**:
1. GitHub receives push to `main` branch
2. Vercel webhook triggered for all 5 projects
3. **dashboard-staging**: Skips build (production branch = v2)
4. **creator-v2-staging**: Skips build (production branch = v2)
5. **kstorybridge-dashboard**: Builds and deploys
6. **kstorybridge-creator**: Builds and deploys
7. **kstorybridge-website**: Builds and deploys

**Result**: All production apps update simultaneously (dashboard V1 + creator-v2 + website)

---

### 4. Production Verification

**Test All Production Domains**:
- https://dashboard.kstorybridge.com
- https://creator.kstorybridge.com (if deployed)
- https://kstorybridge.com

**Repeat Staging Checklist** on production domains

---

## Common Scenarios

### Scenario 1: Feature Development

```bash
# Work on v2 branch
git checkout v2

# Create feature
# ... code, test locally ...

# Commit and push to staging
git add .
git commit -m "feat: new buyer dashboard feature"
git push origin v2

# Test on staging.kstorybridge.com
# If tests pass → merge to main (see workflow above)
```

---

### Scenario 2: Hotfix to Production

```bash
# Critical bug in production requires immediate fix

# Option A: Hotfix directly to main (use sparingly)
git checkout main
# ... make minimal fix ...
git add .
git commit -m "fix: critical auth bug in production"
git push origin main

# Option B: Hotfix via v2 (recommended)
git checkout v2
# ... make fix ...
git push origin v2  # Test on staging
git checkout main
git merge v2
git push origin main

# CRITICAL: After hotfix, sync v2 with main
git checkout v2
git merge main  # Ensure v2 has the hotfix
git push origin v2
```

---

### Scenario 3: Rolling Back Production

```bash
# Production deployment has issues, need to rollback

# Option 1: Revert via Git
git checkout main
git revert <bad-commit-hash>
git push origin main

# Option 2: Revert via Vercel Dashboard
# 1. Go to Vercel project → Deployments
# 2. Find last good deployment
# 3. Click "..." → "Redeploy"
# 4. Confirm rollback

# CRITICAL: After rollback, sync v2
git checkout v2
git merge main  # Or rebase to clean history
git push origin v2
```

---

## Environment Variables Management

### Where to Set Environment Variables

**Vercel Dashboard** (Recommended):
1. Go to Vercel project → Settings → Environment Variables
2. Add variables for each environment:
   - Production
   - Preview (optional)
   - Development (optional)

**Local Development** (`.env.local`):
- Never commit `.env` files
- Use `.env.example` as template
- Store in `.gitignore`

### Key Environment Variables

#### All Apps
```env
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Dashboard & Creator
```env
VITE_DASHBOARD_URL=https://dashboard.kstorybridge.com
VITE_CREATOR_URL=https://creator.kstorybridge.com
VITE_OPENAI_ENABLED=true
VITE_DEBUG_MODE=false  # true for staging
```

#### Website
```env
VITE_WEBSITE_URL=https://kstorybridge.com
VITE_DASHBOARD_URL=https://dashboard.kstorybridge.com
VITE_CREATOR_URL=https://creator.kstorybridge.com
```

---

## Troubleshooting

### Issue: All projects deploy on v2 push

**Symptom**: Pushing to `v2` triggers deployments for dashboard, creator, and website projects

**Solution**:
1. Check Ignored Build Step in each Vercel project (Settings → Git)
2. Verify command: `if [ "$VERCEL_GIT_COMMIT_REF" = "v2" ]; then exit 0; else exit 1; fi`
3. Ensure command is in **Ignored Build Step** field (not Build Command)
4. Save and wait 2 minutes for Vercel cache to clear

---

### Issue: Staging doesn't deploy on v2 push

**Symptom**: Pushing to `v2` doesn't trigger dashboard-staging deployment

**Solution**:
1. Verify Production Branch is set to `v2` (not `main`)
2. Check Ignored Build Step is **empty** (builds all commits)
3. Review deployment logs in Vercel dashboard
4. Verify Git integration is connected

---

### Issue: "Failed to fetch module" errors after deployment

**Symptom**: Navigation works locally but fails in production with module loading errors

**Solution**:
1. Verify `vercel.json` has correct rewrite rules (see Vercel.json section)
2. Check exclusions: `(?!api|assets|js|docs)`
3. Test static asset URLs directly (e.g., `/assets/Profile-xyz.js`)
4. Verify MIME types in Network tab (should be `application/javascript`, not `text/html`)

**Reference**: See `docs/guides/DEPLOYMENT_INSTRUCTIONS.md` for detailed fix

---

### Issue: OAuth fails on staging/production

**Symptom**: Authentication works locally but fails in deployed environments

**Solution**:
1. Add redirect URLs to Supabase (Authentication → URL Configuration):
   ```
   https://staging.kstorybridge.com/auth/callback
   https://dashboard.kstorybridge.com/auth/callback
   https://creator.kstorybridge.com/auth/callback
   ```
2. Update Site URL: `https://dashboard.kstorybridge.com`
3. Verify `VITE_DASHBOARD_URL` in Vercel environment variables
4. Check `VITE_CREATOR_URL` for creator app redirects

---

### Issue: Environment variables not working in production

**Symptom**: Features work locally but fail in production (missing config)

**Solution**:
1. Go to Vercel project → Settings → Environment Variables
2. Verify all variables are set for **Production** environment
3. Add `VITE_` prefix for client-side variables (Vite requirement)
4. Redeploy to apply new variables (Settings → Deployments → Redeploy)

---

## Git History Visualization

### Recent Commit Structure (as of 2025-10-22)

```
* cbd3a797 (HEAD -> v2, origin/v2) admin revival + creator page restructureing
* ef480ce3 docs: update workflow documentation for non-worktree structure
| *   360a7305 (origin/main, main) Merge v2: Pitch analytics integration
| |\
| |/
|/|
* | 434d4b50 pitch analytics completed
* | c63c6458 md file optimization & apply pitch_analytics to chatbot
* | 6fa12682 feat: Add welcome video for first-time users
```

**Interpretation**:
- `v2` branch is 2 commits ahead of `main`
- `main` has merged v2 previously (360a7305)
- Development continues on `v2` after merge
- Next step: Merge v2 → main when staging tests pass

---

## Monorepo Structure

### Workspace Configuration

**Root `package.json`**:
```json
{
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:dashboard": "npm run dev --workspace=apps/dashboard",
    "dev:creator": "npm run dev --workspace=apps/creator",
    "dev:website": "npm run dev --workspace=apps/website",
    "build:all": "npm run build:packages && npm run build:dashboard && npm run build:website && npm run build:creator"
  }
}
```

### App Directories

```
apps/
├── dashboard/        # Buyer dashboard (port 8081)
│   ├── vercel.json
│   └── package.json
├── creator/          # Creator dashboard (port 8082)
│   ├── vercel.json
│   └── package.json
└── website/          # Marketing site (port 5173)
    ├── vercel.json
    └── package.json
```

### Vercel Root Directory Settings

**CRITICAL**: Each Vercel project must have Root Directory configured

| Vercel Project | Root Directory |
|----------------|----------------|
| dashboard-staging | `apps/dashboard` |
| kstorybridge-dashboard | `apps/dashboard` |
| kstorybridge-creator | `apps/creator` |
| kstorybridge-website | `apps/website` |

**Without this setting**: Vercel builds from repo root → fails with "Could not resolve entry module 'index.html'"

---

## Supabase Integration

### Shared Database

All apps share **one Supabase project**:
- **Project ID**: `dlrnrgcoguxlkkcitlpd`
- **URL**: `https://dlrnrgcoguxlkkcitlpd.supabase.co`

### Migration Management

**Separate Migration Directories**:
```
apps/dashboard/supabase/migrations/
apps/creator/supabase/migrations/
apps/website/supabase/migrations/
```

**CRITICAL**: Never create loose SQL files in root. Always use migration directories.

### Edge Functions

**Shared Edge Functions** (deployed to Supabase):
```
apps/dashboard/supabase/functions/
├── chat-orchestrator/       # AI chatbot
├── create-buyer-oauth/      # Buyer OAuth signup
├── create-creator-oauth/    # Creator OAuth signup
└── extract-pitch-test/      # Pitch deck extraction
```

**Deployment**:
```bash
cd apps/dashboard
npx supabase functions deploy chat-orchestrator
```

---

## Security Best Practices

### Credential Management

✅ **DO**:
- Store secrets in Vercel Dashboard (Environment Variables)
- Use Supabase service role key for edge functions only
- Rotate API keys regularly
- Use `.gitignore` for all `.env` files

❌ **DON'T**:
- Commit `.env` files to Git
- Share secrets in Slack/email
- Use production keys in development
- Expose service role key client-side

### Branch Protection

**Recommended GitHub Settings**:
```yaml
main branch:
  - Require pull request reviews
  - Require status checks to pass
  - Prevent force pushes
  - Require linear history

v2 branch:
  - Prevent force pushes
  - Allow direct commits (for rapid development)
```

---

## Quick Reference Commands

### Daily Development
```bash
# Start development
git checkout v2
npm run dev:dashboard  # Or dev:creator, dev:website

# Commit and test on staging
git add .
git commit -m "feat: your feature"
git push origin v2

# Deploy to production (after staging tests pass)
git checkout main
git merge v2
git push origin main
```

### Emergency Procedures
```bash
# Hotfix production
git checkout main
# ... make fix ...
git push origin main

# Rollback production
git checkout main
git revert <commit>
git push origin main

# Check deployment status
# Visit Vercel dashboard or use:
vercel list
```

### Debugging Deployments
```bash
# View recent commits
git log --oneline --graph --all --decorate -10

# Check current branch
git branch -vv

# Verify remote
git remote -v

# Check Vercel project
cat .vercel/project.json
```

---

## Related Documentation

- **[Root CLAUDE.md](../../CLAUDE.md)** - Complete monorepo guide
- **[DEPLOYMENT_STRATEGY.md](./DEPLOYMENT_STRATEGY.md)** - High-level deployment architecture
- **[DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md)** - Vercel module fix deployment steps
- **[AUTH_DOCUMENTATION.md](../active/AUTH_DOCUMENTATION.md)** - Authentication system reference
- **[CREATOR_APP_QUICK_REFERENCE.md](../CREATOR_APP_QUICK_REFERENCE.md)** - Creator app separation status

---

## Change Log

### 2025-10-22
- **Added**: Comprehensive Git deployment structure documentation
- **Updated**: Three-app architecture (dashboard, creator, website)
- **Updated**: Vercel.json rewrite rules with static asset exclusions
- **Updated**: Branch strategy to reflect current `kstorybridge-integrated` repo

### 2025-10-21
- **Updated**: Development workflow for non-worktree structure
- **Updated**: Archive directory references

### 2025-10-13
- **Added**: Creator app Vercel project configuration (planned)
- **Updated**: Monorepo workspace scripts

---

## Summary

### Current State (2025-10-22)

✅ **Configured**:
- Git repository: `kstorybridge-integrated`
- Two-branch strategy: `v2` (staging) + `main` (production)
- Four Vercel projects: 1 staging + 3 production
- Ignored Build Step prevents duplicate builds
- Vercel.json rewrite rules prevent module errors
- Supabase OAuth callbacks configured for all domains

🚧 **In Progress**:
- Creator app deployment (Phase 1 complete, 8% of separation)
- Cross-domain authentication redirects
- Creator app DNS configuration

⏳ **Planned**:
- Separate staging environments for creator and website
- GitHub Actions CI/CD integration
- Automated testing before production deployment

---

**Last Reviewed**: 2025-10-22
**Maintainer**: Development Team
**Status**: ✅ Production-ready documentation
