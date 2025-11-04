# Turborepo + Vercel Selective Deployment Guide

**Last Updated**: 2025-11-02

This guide explains how to configure Vercel projects to use Turborepo's `turbo-ignore` for selective deployments. With this setup, Vercel will only build and deploy apps that have actually changed.

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
npx turbo-ignore
```

**Remove any existing logic** like:
```bash
# OLD (remove this):
if [ "$VERCEL_GIT_COMMIT_REF" = "v2" ]; then exit 0; else exit 1; fi
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
cd apps/dashboard
npx turbo-ignore
# Should output: "Proceeding with build" or "Skipping build"
```

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
| dashboard-staging | v2 | `apps/dashboard` | `npm run build` | `npx turbo-ignore` |
| creator-staging | v2 | `apps/creator` | `npm run build` | `npx turbo-ignore` |
| kstorybridge-dashboard | main | `apps/dashboard` | `npm run build` | `npx turbo-ignore` |
| kstorybridge-creator | main | `apps/creator` | `npm run build` | `npx turbo-ignore` |
| kstorybridge-website | main | `apps/website` | `npm run build` | `npx turbo-ignore` |

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

### Issue: All Apps Deploy Every Time

**Possible Causes:**
1. `npx turbo-ignore` not set in Vercel's "Ignored Build Step"
2. Changes to root-level files (triggers all apps)
3. Changes to `.env` files (not in `.gitignore`)

**Solution:**
- Verify Vercel settings for each project
- Check git diff to see what changed
- Ensure `.env` files are in `.gitignore`

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
# apps/dashboard/ignore-build.sh
#!/bin/bash

# Always deploy on main branch
if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
  echo "Main branch - always deploy"
  exit 1
fi

# Otherwise use turbo-ignore
npx turbo-ignore
```

Then set **Ignored Build Step** to:
```bash
bash apps/dashboard/ignore-build.sh
```

---

## Summary Checklist

Before deploying to production:

- [ ] Updated all 5 Vercel projects with `npx turbo-ignore`
- [ ] Tested selective deployment with Dashboard change
- [ ] Tested selective deployment with Creator change
- [ ] Verified shared package changes trigger correct apps
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

**Questions or Issues?**

If you encounter any problems with this setup, check:
1. Vercel build logs for `turbo-ignore` output
2. Local turbo-ignore test: `cd apps/{app} && npx turbo-ignore`
3. Turborepo cache: `npx turbo run build --dry-run`
