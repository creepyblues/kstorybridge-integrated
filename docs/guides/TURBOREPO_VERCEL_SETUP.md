# Turborepo + Vercel Selective Deployment Guide

**Last Updated**: 2025-11-05

This guide explains how to configure Vercel projects to use Turborepo's `turbo-ignore` for selective deployments. With this setup, Vercel will only build and deploy apps that have actually changed.

---

## Configuration Status

**✅ Updated 2025-11-05**: All Vercel project settings have been updated to use `cd ../.. && npx turbo-ignore`. Production deployments are being triggered to apply the corrected configuration.

**Previous Issue**: Projects were configured with `npx turbo-ignore` (missing `cd ../..` prefix), causing all apps to deploy on every commit. This has been corrected.

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

**Replace the existing command** with:

```bash
cd ../.. && npx turbo-ignore
```

**⚠️ IMPORTANT**: The `cd ../..` is **REQUIRED** because:
- Vercel runs commands from the "Root Directory" (e.g., `apps/dashboard`)
- turbo-ignore needs to run from the **monorepo root** to access the full workspace
- `cd ../..` changes from `apps/dashboard` → monorepo root before running turbo-ignore

**Remove any existing logic** like:
```bash
# OLD (remove this):
if [ "$VERCEL_GIT_COMMIT_REF" = "v2" ]; then exit 0; else exit 1; fi

# OR

# OLD (remove this):
npx turbo-ignore   # Missing cd ../.. will cause ALL apps to deploy
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
cd ../.. && npx turbo-ignore
# Should output: "Proceeding with build" or "Skipping build"
```

**Note**: Always test with `cd ../.. && npx turbo-ignore` to match Vercel's execution context.

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
| dashboard-staging | v2 | `apps/dashboard` | `npm run build` | `cd ../.. && npx turbo-ignore` |
| creator-staging | v2 | `apps/creator` | `npm run build` | `cd ../.. && npx turbo-ignore` |
| kstorybridge-dashboard | main | `apps/dashboard` | `npm run build` | `cd ../.. && npx turbo-ignore` |
| kstorybridge-creator | main | `apps/creator` | `npm run build` | `cd ../.. && npx turbo-ignore` |
| kstorybridge-website | main | `apps/website` | `npm run build` | `cd ../.. && npx turbo-ignore` |

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

**Root Cause**: Missing `cd ../..` in the "Ignored Build Step" command.

**Why This Happens**:
```bash
# WRONG (what you might have):
Ignored Build Step: npx turbo-ignore

# Vercel executes from Root Directory (apps/dashboard):
cd apps/dashboard          # Vercel's Root Directory setting
npx turbo-ignore          # Runs from apps/dashboard ❌

# turbo-ignore cannot access:
# - Root turbo.json
# - Root package.json workspaces
# - Other apps in apps/*
# - Full monorepo git history

# Result: Always returns exit 1 (proceed with build)
```

**Solution**:
```bash
# CORRECT:
Ignored Build Step: cd ../.. && npx turbo-ignore

# Vercel executes:
cd apps/dashboard          # Vercel's Root Directory
cd ../.. && npx turbo-ignore  # Changes to monorepo root ✅

# Now turbo-ignore has full context and works correctly
```

**Verification**:
1. Check Vercel build logs - look for `turbo-ignore` output
2. Test locally: `cd apps/dashboard && cd ../.. && npx turbo-ignore`
3. Ensure command includes `cd ../..` for ALL 5 Vercel projects

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

- [ ] Updated all 5 Vercel projects with `cd ../.. && npx turbo-ignore`
- [ ] Verified command includes `cd ../..` (CRITICAL - without this, all apps deploy)
- [ ] Tested selective deployment with Dashboard change
- [ ] Tested selective deployment with Creator change
- [ ] Verified shared package changes trigger correct apps
- [ ] Checked Vercel build logs to confirm turbo-ignore is running from monorepo root
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

**Correct Vercel "Ignored Build Step" Command**:
```bash
cd ../.. && npx turbo-ignore
```

**Why `cd ../..` is Required**:
- Vercel runs from `apps/[app]` (Root Directory setting)
- turbo-ignore needs monorepo root context
- Without it, turbo-ignore cannot determine workspace changes
- Result: ALL apps deploy every time ❌

**Testing Locally**:
```bash
cd apps/dashboard
cd ../.. && npx turbo-ignore
# Should output selective build decision
```

---

**Questions or Issues?**

If you encounter any problems with this setup, check:
1. Vercel build logs for `turbo-ignore` output
2. Local turbo-ignore test: `cd apps/{app} && cd ../.. && npx turbo-ignore`
3. Verify "Ignored Build Step" field in Vercel dashboard includes `cd ../..`
4. Turborepo cache: `npx turbo run build --dry-run`
