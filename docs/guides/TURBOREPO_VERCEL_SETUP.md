# Turborepo + Vercel Selective Deployment Guide

**Last Updated**: 2025-11-08

> ⚠️ **LEGACY REFERENCE**: This guide documents the old direct `turbo-ignore` approach.
>
> **Current production setup (2025-11-08)**:
> - **Staging**: Manual deployment (auto-deploy disabled via vercel.json)
> - **Production**: Enhanced wrapper script (`scripts/vercel-ignore-turbo.sh`)
> - **Wrapper auto-detects workspace names** (no manual arguments)
> - **6 Vercel projects**: One vercel.json controls multiple projects via branch keys
>
> **For current setup**:
> - [MANUAL_DEPLOYMENT_GUIDE.md](../../MANUAL_DEPLOYMENT_GUIDE.md) - Complete deployment workflows
> - [VERCEL_DEPLOYMENT_ARCHITECTURE.md](./VERCEL_DEPLOYMENT_ARCHITECTURE.md) - Complete architecture reference
> - Root [CLAUDE.md](../../CLAUDE.md) - Turborepo Build System section (updated)
>
> This document remains as technical reference for understanding turbo-ignore internals.

---

## Current Production Setup (2025-11-08)

**Staging (v2 branch)**:
- Auto-deploy **DISABLED** via `vercel.json`
- Manual deployment required: `cd apps/creator && vercel`
- See [MANUAL_DEPLOYMENT_GUIDE.md](../../MANUAL_DEPLOYMENT_GUIDE.md)

**Production (main branch)**:
- Auto-deploy **ENABLED** with selective builds
- Uses enhanced wrapper: `cd ../.. && bash scripts/vercel-ignore-turbo.sh`
- Wrapper script auto-detects workspace from package.json

**Why we use wrapper script instead of direct turbo-ignore**:
- Auto-detection of workspace names (no manual arguments needed)
- Better error handling and debugging output
- Works reliably with Turborepo 2.0 breaking changes

---

## ⚠️ Turborepo 2.0 Breaking Change

**Critical**: Turborepo 2.0 renamed the `pipeline` field to `tasks` in turbo.json files.

**Build Error if not fixed**:
```
x Found `pipeline` field instead of `tasks`.
Rename `pipeline` field to `tasks`
Error: Command "turbo run build" exited with 1
```

**Required turbo.json structure**:
```json
{
  "extends": ["//"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

**Files that need correct structure**:
- `/apps/creator/turbo.json`
- `/apps/dashboard/turbo.json`
- `/apps/website/turbo.json`

---

## Legacy Configuration Reference (for historical context)

**⚠️ OUTDATED**: The commands below are no longer used in production. See "Current Production Setup" above.

---

## Overview

### What is turbo-ignore?

`turbo-ignore` is a tool that checks if an app has changed since the last deployment. If the app hasn't changed (and neither have its dependencies), Vercel will skip the build, saving time and resources.

### Benefits

- ✅ **Faster deployments** - Only changed apps are built
- ✅ **Reduced build minutes** - Don't waste Vercel build time on unchanged apps
- ✅ **Safer deployments** - Unchanged apps stay stable
- ✅ **Better CI/CD** - Automatic detection of what needs to deploy

---

## Configuration Steps

You need to update **all 5 Vercel projects**:

1. `dashboard-staging` (v2 branch)
2. `creator-staging` (v2 branch)
3. `kstorybridge-dashboard` (main branch)
4. `kstorybridge-creator` (main branch)
5. `kstorybridge-website` (main branch)

### For Each Project:

#### Step 1: Go to Vercel Project Settings

1. Open https://vercel.com/dashboard
2. Select the project (e.g., `dashboard-staging`)
3. Go to **Settings** → **Git**
4. Scroll to **Ignored Build Step** section

#### Step 2: Configure Ignored Build Step

**Replace the existing command** with the correct command for each project:

| Vercel Project | Ignored Build Step Command |
|----------------|----------------------------|
| dashboard-staging | `cd ../.. && npx turbo-ignore @kstorybridge/dashboard` |
| dashboard-next | `cd ../.. && npx turbo-ignore @kstorybridge/dashboard-next` |
| kstorybridge-dashboard | `cd ../.. && npx turbo-ignore @kstorybridge/dashboard` |
| creator-staging | `cd ../.. && npx turbo-ignore @kstorybridge/creator` |
| kstorybridge-creator | `cd ../.. && npx turbo-ignore @kstorybridge/creator` |
| kstorybridge-website | `cd ../.. && npx turbo-ignore @kstorybridge/website` |

**⚠️ CRITICAL**: Both `cd ../..` AND the workspace argument are **REQUIRED**:
- `cd ../..` - Changes from `apps/[app]` to monorepo root
- `@kstorybridge/[app]` - Specifies which workspace to check for changes
- **Without workspace argument**: turbo-ignore fails and deploys ALL apps (safety fallback)

**How to find workspace name**:
Open the app's `package.json` and look for the `"name"` field:
```json
{
  "name": "@kstorybridge/dashboard"  ← Use this value
}
```

**Remove any existing logic** like:
```bash
# OLD (remove this):
if [ "$VERCEL_GIT_COMMIT_REF" = "v2" ]; then exit 0; else exit 1; fi

# OR

# OLD (remove these - both are incomplete):
npx turbo-ignore
cd ../.. && npx turbo-ignore  # Missing workspace argument
```

#### Step 3: Keep Build Command Unchanged

**Build Command** should remain as is:
- Dashboard: `npm run build`
- Creator: `npm run build`
- Website: `npm run build`

**Root Directory** should remain as is:
- Dashboard: `apps/dashboard`
- Creator: `apps/creator`
- Website: `apps/website`

---

## How turbo-ignore Works

### Detection Logic

`turbo-ignore` checks:

1. **App code changes** - Files in `apps/dashboard/`, `apps/creator/`, `apps/website/`
2. **Shared package changes** - Files in `packages/*` that the app depends on
3. **Root config changes** - `turbo.json`, root `package.json`

### Examples

**Scenario 1**: Change only `apps/dashboard/src/pages/Home.tsx`
- ✅ Dashboard deploys
- ❌ Creator skips
- ❌ Website skips

**Scenario 2**: Change `packages/auth/src/index.ts`
- ✅ Dashboard deploys (depends on @kstorybridge/auth)
- ❌ Creator skips (no @kstorybridge dependencies)
- ✅ Website deploys (depends on @kstorybridge/auth)

**Scenario 3**: Change only `apps/creator/src/components/TitleCard.tsx`
- ❌ Dashboard skips
- ✅ Creator deploys
- ❌ Website skips

**Scenario 4**: Change root `turbo.json`
- ✅ All apps deploy (root config affects everything)

---

## Enabling Vercel Remote Cache

Vercel Remote Cache allows your team to share build caches, speeding up builds in CI/CD and on team members' machines.

### Setup Steps

1. Go to **Vercel Dashboard** → **Your Team Settings**
2. Navigate to **Caching** section
3. Enable **Remote Caching**
4. Copy the token that's generated

### Using Remote Cache Locally

Add to your `.bashrc` or `.zshrc`:

```bash
export TURBO_TOKEN="your-token-here"
export TURBO_TEAM="your-team-slug"
```

Or create a `.turbo/config.json` file in your home directory:

```json
{
  "teamId": "your-team-slug",
  "token": "your-token-here"
}
```

### Verify Remote Cache is Working

Run a build:

```bash
npm run build:creator
```

Look for:
- First build: `• Remote caching enabled` (if configured)
- Second build: `cache hit, replaying logs` + `FULL TURBO`

---

## Testing Your Setup

### Test 1: Verify turbo-ignore Locally

From the root of your monorepo:

```bash
# Test from app directory (simulating Vercel environment)
cd apps/dashboard
cd ../.. && npx turbo-ignore @kstorybridge/dashboard
# Should output: "Proceeding with build" or "Ignoring the change"
```

**Note**: Always test with the workspace argument (`@kstorybridge/dashboard`) to match Vercel's execution context.

### Test 2: Test Selective Deployment

1. **Make a change to Dashboard only**:
   ```bash
   # Edit a file in apps/dashboard
   echo "// test" >> apps/dashboard/src/pages/Home.tsx
   git add .
   git commit -m "Test: Dashboard change only"
   git push origin v2  # For staging
   ```

2. **Check Vercel Dashboard**:
   - ✅ `dashboard-staging` should trigger a build
   - ❌ `creator-staging` should show "Build skipped"
   - ❌ `kstorybridge-website` should show "Build skipped"

### Test 3: Test Package Change Propagation

1. **Make a change to shared package**:
   ```bash
   # Edit a file in packages/auth
   echo "// test" >> packages/auth/src/index.ts
   git add .
   git commit -m "Test: Auth package change"
   git push origin v2
   ```

2. **Check Vercel Dashboard**:
   - ✅ `dashboard-staging` should build (depends on @kstorybridge/auth)
   - ❌ `creator-staging` should skip (no package dependencies)
   - ✅ `kstorybridge-website` should build (depends on @kstorybridge/auth)

---

## Configuration Reference

### Complete Vercel Project Settings

| Project | Branch | Root Directory | Build Command | Ignored Build Step |
|---------|--------|----------------|---------------|-------------------|
| dashboard-staging | v2 | `apps/dashboard` | `npm run build` | `cd ../.. && npx turbo-ignore @kstorybridge/dashboard` |
| dashboard-next | v2 | `apps/dashboard-next` | `npm run build` | `cd ../.. && npx turbo-ignore @kstorybridge/dashboard-next` |
| creator-staging | v2 | `apps/creator` | `npm run build` | `cd ../.. && npx turbo-ignore @kstorybridge/creator` |
| kstorybridge-dashboard | main | `apps/dashboard` | `npm run build` | `cd ../.. && npx turbo-ignore @kstorybridge/dashboard` |
| kstorybridge-creator | main | `apps/creator` | `npm run build` | `cd ../.. && npx turbo-ignore @kstorybridge/creator` |
| kstorybridge-website | main | `apps/website` | `npm run build` | `cd ../.. && npx turbo-ignore @kstorybridge/website` |

### Dependency Graph

```
packages/auth ───────┐
                      ├─→ apps/dashboard ✅
packages/ui ─────────┤
                      └─→ apps/website ✅

packages/build-config ──→ apps/dashboard ✅
packages/testing ───────→ apps/dashboard ✅, apps/website ✅

apps/creator ✅ (INDEPENDENT - no package dependencies)
```

**Key Insight**: Creator app is independent, so it only deploys when:
- Files in `apps/creator/` change
- Root config files change (turbo.json, root package.json)

---

## Troubleshooting

### Issue: All Apps Deploy Every Time (MOST COMMON)

**Root Cause 1**: Missing `cd ../..` in the "Ignored Build Step" command.
**Root Cause 2**: Missing workspace argument after `npx turbo-ignore`.

**Why This Happens**:
```bash
# WRONG #1 (missing cd ../..):
Ignored Build Step: npx turbo-ignore

# Vercel executes from Root Directory (apps/dashboard):
cd apps/dashboard          # Vercel's Root Directory setting
npx turbo-ignore          # Runs from apps/dashboard ❌

# WRONG #2 (missing workspace argument):
Ignored Build Step: cd ../.. && npx turbo-ignore

# Vercel executes:
cd apps/dashboard          # Vercel's Root Directory
cd ../.. && npx turbo-ignore  # Changes to root ✅ but...
# Error: "No package found with name 'kstorybridge-monorepo' in workspace"
# Result: Fallback to deploying ALL apps ❌
```

**Solution**:
```bash
# CORRECT (both cd ../.. AND workspace argument):
Ignored Build Step: cd ../.. && npx turbo-ignore @kstorybridge/dashboard

# For each project, use the correct workspace name:
# - dashboard-staging: @kstorybridge/dashboard
# - creator-staging: @kstorybridge/creator
# - kstorybridge-website: @kstorybridge/website
```

**Verification**:
1. Check Vercel build logs - look for turbo-ignore success message
2. Test locally: `cd apps/dashboard && cd ../.. && npx turbo-ignore @kstorybridge/dashboard`
3. Should output: "Using '@kstorybridge/dashboard' as workspace from arguments"
4. Ensure ALL 6 Vercel projects have BOTH `cd ../..` AND workspace argument

---

### Issue: Some Apps Still Deploy When They Shouldn't

**Possible Causes:**
1. Changes to root-level files (triggers all apps)
2. Changes to shared packages that app depends on
3. Changes to `.env` files (should be in `.gitignore`)

**Solution:**
- Check `git diff` to see exactly what changed
- Review dependency graph (see Configuration Reference section)
- Ensure `.env` files are in `.gitignore`
- Verify app's `package.json` dependencies match expected graph

### Issue: App Doesn't Deploy When It Should

**Possible Causes:**
1. Vercel is caching the old ignored build step setting
2. The app's `turbo.json` is misconfigured

**Solution:**
- Trigger a manual deployment in Vercel
- Verify `apps/{app}/turbo.json` exists and extends `//`
- Check Vercel build logs for `turbo-ignore` output

### Issue: Remote Cache Not Working

**Possible Causes:**
1. Not logged in to Vercel
2. Token not configured
3. Team ID incorrect

**Solution:**
```bash
# Login to Vercel
npx turbo login

# Verify token
npx turbo config get teamId
npx turbo config get token

# If needed, set manually
npx turbo config set teamId "your-team-slug"
npx turbo config set token "your-token"
```

---

## Advanced: Custom Ignore Logic

If you need more complex logic (e.g., always deploy on certain branches), you can create a custom script:

```bash
# scripts/ignore-build.sh (at monorepo root)
#!/bin/bash

# Always deploy on main branch
if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
  echo "Main branch - always deploy"
  exit 1
fi

# Otherwise use turbo-ignore (already at monorepo root)
npx turbo-ignore
```

Then set **Ignored Build Step** to:
```bash
cd ../.. && bash scripts/ignore-build.sh
```

**Note**: Place the script at monorepo root (`scripts/`) so it has full context.

---

## Summary Checklist

Before deploying to production:

- [ ] Updated all 6 Vercel projects with complete command: `cd ../.. && npx turbo-ignore @kstorybridge/[workspace]`
- [ ] Verified command includes BOTH `cd ../..` AND workspace argument (CRITICAL)
- [ ] Verified workspace names match package.json "name" field for each app
- [ ] Tested turbo-ignore locally with workspace argument
- [ ] Tested selective deployment with Dashboard change (only dashboard deploys)
- [ ] Tested selective deployment with Creator change (only creator deploys)
- [ ] Verified shared package changes trigger correct apps
- [ ] Checked Vercel build logs for turbo-ignore success message
- [ ] Confirmed no "No package found" errors in logs
- [ ] Enabled Vercel Remote Cache (optional but recommended)
- [ ] Team members have configured remote cache locally
- [ ] Updated documentation (CLAUDE.md, deployment guides)

---

## Related Documentation

- [Root CLAUDE.md](../../CLAUDE.md) - Monorepo overview
- [Git Deployment Structure](./GIT_DEPLOYMENT_STRUCTURE.md) - Branch/domain mapping
- [Deployment Instructions](./DEPLOYMENT_INSTRUCTIONS.md) - General deployment guide
- [Turborepo Official Docs](https://turbo.build/repo/docs) - Turborepo documentation

---

## Quick Reference

**Correct Vercel "Ignored Build Step" Command Format**:
```bash
cd ../.. && npx turbo-ignore @kstorybridge/[workspace-name]
```

**Complete Commands by Project**:
- dashboard-staging: `cd ../.. && npx turbo-ignore @kstorybridge/dashboard`
- dashboard-next: `cd ../.. && npx turbo-ignore @kstorybridge/dashboard-next`
- creator-staging: `cd ../.. && npx turbo-ignore @kstorybridge/creator`
- kstorybridge-dashboard: `cd ../.. && npx turbo-ignore @kstorybridge/dashboard`
- kstorybridge-creator: `cd ../.. && npx turbo-ignore @kstorybridge/creator`
- kstorybridge-website: `cd ../.. && npx turbo-ignore @kstorybridge/website`

**Why Both Parts Are Required**:
- `cd ../..` - Changes from `apps/[app]` to monorepo root (for full context)
- `@kstorybridge/[workspace]` - Specifies which workspace to check for changes
- **Without workspace argument**: turbo-ignore fails and deploys ALL apps ❌

**Testing Locally**:
```bash
cd apps/dashboard
cd ../.. && npx turbo-ignore @kstorybridge/dashboard
# Should output: "Using '@kstorybridge/dashboard' as workspace from arguments"
# Then: "Proceeding with build" or "Ignoring the change"
```

---

**Questions or Issues?**

If you encounter any problems with this setup, check:
1. Vercel build logs for `turbo-ignore` output
2. Local turbo-ignore test: `cd apps/{app} && cd ../.. && npx turbo-ignore`
3. Verify "Ignored Build Step" field in Vercel dashboard includes `cd ../..`
4. Turborepo cache: `npx turbo run build --dry-run`
