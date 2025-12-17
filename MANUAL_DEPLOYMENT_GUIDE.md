# Manual Deployment Guide - KStoryBridge Monorepo

**Last Updated**: 2025-12-17

## TL;DR - Deploy Dashboard Staging

```bash
cd /Users/sungholee/code/kstorybridge
vercel link --project dashboard-staging --yes
vercel --prod
```

> **Important**: Deploy from monorepo ROOT, not from `apps/dashboard`. See [Troubleshooting](#issue-the-provided-path-does-not-exist-error) for why.

---

## Overview

The KStoryBridge monorepo uses a **hybrid deployment model**:

- **Staging (v2 branch)**: Manual deployment only (you control when to deploy)
- **Production (main branch)**: Auto-deployment with turbo-ignore (only changed apps deploy)

This guide explains how to manually deploy staging apps after pushing to the v2 branch.

---

## Quick Reference

### Manual Staging Deployment

**⚠️ IMPORTANT**: Deploy from the **monorepo root**, not from the app directory. The Vercel project has `Root Directory` set to `apps/dashboard`, so running from the app directory causes path errors.

```bash
# Dashboard staging (from monorepo root)
cd /Users/sungholee/code/kstorybridge
vercel link --project dashboard-staging --yes
vercel --prod

# Creator staging (from monorepo root)
cd /Users/sungholee/code/kstorybridge
vercel link --project creator-staging --yes
vercel --prod
```

> **Why from root?** Vercel's `Root Directory` setting is applied relative to where you run the CLI. If you run from `apps/dashboard/` and Vercel has `Root Directory = apps/dashboard`, it looks for `apps/dashboard/apps/dashboard` which doesn't exist.

> **Note**: Without `--prod`, Vercel creates a preview deployment that doesn't update the staging domain. Use `--prod` to deploy to the staging domain directly.

### Manual Production Deployment

```bash
# Emergency manual production deploy (usually auto-deploys)
cd apps/creator
vercel --prod             # Deploy to production

cd apps/dashboard
vercel --prod             # Deploy to production
```

---

## Deployment Architecture

### Vercel Projects

| Project | Branch | Type | Auto-Deploy | Manual Command |
|---------|--------|------|-------------|----------------|
| **creator-staging** | v2 | Staging | ❌ Disabled | `cd apps/creator && vercel` |
| **dashboard-staging** | v2 | Staging | ❌ Disabled | `cd apps/dashboard && vercel` |
| **creator** | main | Production | ✅ Enabled* | `cd apps/creator && vercel --prod` |
| **dashboard** | main | Production | ✅ Enabled* | `cd apps/dashboard && vercel --prod` |
| **website** | main | Production | ✅ Enabled* | `cd apps/website && vercel --prod` |
| **website-staging** | v2 | Staging | ❌ Disabled | `cd apps/website && vercel` |

\*Auto-deploys only when app changes detected (via turbo-ignore)

---

## Configuration Details

### Architecture: One App, Two Vercel Projects

Each app directory controls TWO separate Vercel projects through a SINGLE `vercel.json` file:

**apps/dashboard/vercel.json** controls:
- `dashboard-staging` (v2 branch, manual deploy)
- `kstorybridge-dashboard` (main branch, auto-deploy)

**apps/creator/vercel.json** controls:
- `creator-staging` (v2 branch, manual deploy)
- `creator` (main branch, auto-deploy)

**apps/website/vercel.json** controls:
- `kstorybridge-website` (main branch, auto-deploy)

**apps/dashboard-next/vercel.json** controls:
- `dashboard-next` (both branches, manual deploy - still in development)

The `git.deploymentEnabled` object has keys matching Git branch names. Each Vercel project checks the branch it's configured for.

**See**: [VERCEL_DEPLOYMENT_ARCHITECTURE.md](docs/guides/VERCEL_DEPLOYMENT_ARCHITECTURE.md) for complete mapping

### vercel.json (Git Settings)

Each app has `vercel.json` configured to control deployment behavior for multiple projects:

```json
{
  "git": {
    "deploymentEnabled": {
      "v2": false,      // Staging projects: manual deploy only
      "main": true      // Production projects: auto-deploy enabled
    }
  }
}
```

**How it works**:
- Staging projects (e.g., `dashboard-staging`) read `"v2": false` → manual deployment required
- Production projects (e.g., `kstorybridge-dashboard`) read `"main": true` → auto-deploy enabled

### Ignored Build Step Configuration

**Staging projects** use `Automatic` (no custom script):
- **Ignored Build Step**: `Automatic`
- Reason: Staging auto-deploy is disabled via `vercel.json`, you manually trigger deploys
- No need for turbo-ignore since you control when builds happen

**Production projects** use turbo-ignore for selective deployment:
- **Ignored Build Step**: `Automatic` (or custom script if needed)
- This allows only changed apps to deploy when merging to main

**Files available for custom selective builds**:
- `/scripts/vercel-ignore-turbo.sh` - Enhanced wrapper script (optional)
- `/apps/creator/turbo.json` - Enables workspace detection
- `/apps/dashboard/turbo.json` - Enables workspace detection
- `/apps/website/turbo.json` - Enables workspace detection

---

## Workflow Examples

### Scenario 1: Deploy i18n changes to staging

```bash
# 1. Make changes on v2 branch
git checkout v2
# ... edit files ...
git commit -m "feat(creator): Add Korean translations"
git push origin v2

# No auto-deploy happens!

# 2. Manually deploy creator to staging
cd apps/creator
vercel

# Output:
# Vercel CLI 46.1.1
# ? Set up and deploy "~/kstorybridge/apps/creator"? [Y/n] y
# ... build output ...
# ✓ Production: https://creator-staging-xyz.vercel.app [2s]

# 3. Test the staging deployment
# Visit https://creator-staging-xyz.vercel.app

# 4. If good, merge to main for production
git checkout main
git merge v2
git push origin main

# Production auto-deploys (only creator, not other apps)
```

### Scenario 2: Deploy only dashboard to staging

```bash
# 1. Push changes
git push origin v2

# 2. Deploy ONLY dashboard
cd apps/dashboard
vercel

# Creator staging NOT deployed (you choose)
```

### Scenario 3: Emergency production deploy

```bash
# If auto-deploy failed or you need immediate deployment:
cd apps/creator
vercel --prod --yes --logs

# --yes: Skip all prompts
# --logs: Show build output in real-time
```

### Scenario 4: Rollback production

```bash
# Method 1: Vercel Dashboard
# Go to https://vercel.com/[your-team]/creator
# Click "Deployments" → Find previous good deployment
# Click "..." → "Promote to Production"

# Method 2: Vercel CLI
vercel rollback [deployment-url]
```

---

## Vercel CLI Reference

### Installation & Login

```bash
# Already installed in package.json (v46.1.1)
npm install -g vercel

# Login (one-time setup)
vercel login
```

### Deployment Commands

```bash
# Basic deployment (staging/preview)
vercel

# Production deployment
vercel --prod

# Skip all prompts (CI/CD)
vercel --yes

# Show build logs in real-time
vercel --logs

# Force new deployment (even if no changes)
vercel --force

# Don't wait for deployment to finish
vercel --no-wait

# Specify working directory
vercel --cwd apps/creator

# Deploy under specific team
vercel --scope [team-name]
```

### Inspection Commands

```bash
# List recent deployments
vercel ls

# Check deployment status
vercel inspect [deployment-url]

# View deployment logs
vercel logs [deployment-url]

# List domains
vercel domains ls

# Check current project settings
vercel project ls
```

---

## Troubleshooting

### Issue: Staging projects auto-deploy when merging to main

**Root Cause**: Staging projects have "Production Branch" set to `main` instead of `v2` in Vercel Dashboard.

**Symptoms**:
- `dashboard-staging` deploys every time you merge PR to main
- `creator-staging` deploys every time you merge PR to main
- Intended manual-only staging projects are auto-deploying

**Solution**:

1. **Verify current "Production Branch" setting**:
   - Go to https://vercel.com/[your-team]/dashboard-staging
   - Navigate to Settings → Git
   - Check "Production Branch" value
   - Should be `v2`, likely shows `main` ❌

2. **Fix dashboard-staging**:
   - Go to Settings → Git
   - Change "Production Branch" from `main` to `v2`
   - Click "Save"

3. **Fix creator-staging**:
   - Go to https://vercel.com/[your-team]/creator-staging
   - Go to Settings → Git
   - Change "Production Branch" from `main` to `v2`
   - Click "Save"

4. **Verify the fix**:
   ```bash
   # Make a test commit and push to main
   git checkout main
   git commit --allow-empty -m "test: verify staging no longer auto-deploys"
   git push origin main

   # Expected: Staging projects do NOT auto-deploy
   # Expected: Production projects DO auto-deploy (if changed)
   ```

**Why this happens**:
- Vercel projects have TWO configuration levels:
  1. **"Production Branch"** (Vercel Dashboard) - Which Git branch to monitor
  2. **`git.deploymentEnabled`** (vercel.json) - Whether to auto-deploy that branch
- If staging projects monitor `main` branch, they'll auto-deploy when `main` updates
- Setting "Production Branch" to `v2` makes them ignore `main` branch pushes entirely

**See**: [VERCEL_DEPLOYMENT_ARCHITECTURE.md - Critical Settings Checklist](docs/guides/VERCEL_DEPLOYMENT_ARCHITECTURE.md#critical-vercel-project-settings-checklist)

### Issue: Staging not updating after `vercel` deploy

**Symptom**: You ran `vercel` but the staging URL still shows old content.

**Root Cause**: The local `.vercel/project.json` is linked to the **production** project, not the staging project.

**Check which project is linked**:
```bash
cat apps/dashboard/.vercel/project.json
# If it shows "dashboard" instead of "dashboard-staging", that's the problem
```

**Solution 1: Use explicit project targeting (recommended)**:
```bash
cd apps/dashboard
vercel --prod --project dashboard-staging
```

**Solution 2: Re-link the directory**:
```bash
cd apps/dashboard
vercel link --project dashboard-staging
vercel --prod
```

**Solution 3: Deploy from Vercel Dashboard**:
1. Go to https://vercel.com/creepyblues-9060s-projects/dashboard-staging
2. Click "Deployments" tab
3. Find a recent preview deployment
4. Click "..." → "Promote to Production"

---

### Issue: Staging still auto-deploys after pushing to v2

**Check**:
1. Verify `vercel.json` has `"v2": false` in git.deploymentEnabled
2. Clear Vercel cache: Go to Project Settings → Git → Clear Cache
3. Redeploy the project settings: Re-save the Git integration

**Solution**:
```bash
# Verify vercel.json config
cat apps/creator/vercel.json | grep -A 5 '"git"'

# Expected output:
# "git": {
#   "deploymentEnabled": {
#     "v2": false,
#     "main": true
#   }
# }
```

### Issue: Production not auto-deploying on main push

**Check**:
1. Verify turbo-ignore script exists: `ls scripts/vercel-ignore-turbo.sh`
2. Check Vercel "Ignored Build Step": Should be `cd ../.. && bash scripts/vercel-ignore-turbo.sh`
3. Verify app-level turbo.json exists: `ls apps/creator/turbo.json`

**Test locally**:
```bash
# From app directory
cd apps/creator
cd ../.. && bash scripts/vercel-ignore-turbo.sh

# Should output:
# Using '@kstorybridge/creator' as workspace from package.json
```

### Issue: All 6 apps still deploying (not selective)

**Diagnosis**:
This means turbo-ignore is not working. Check:

1. **Vercel "Ignored Build Step" setting** (all 6 projects):
   - Should be: `cd ../.. && bash scripts/vercel-ignore-turbo.sh`
   - NOT: `cd ../.. && npx turbo-ignore` (missing auto-detection)

2. **App-level turbo.json files** must exist:
   ```bash
   ls apps/creator/turbo.json
   ls apps/dashboard/turbo.json
   ls apps/website/turbo.json
   ```

3. **Workspace names** must match package.json:
   ```bash
   grep '"name"' apps/creator/package.json
   # Should show: "@kstorybridge/creator"
   ```

**Fix**:
Update all 6 Vercel projects' "Ignored Build Step" to:
```bash
cd ../.. && bash scripts/vercel-ignore-turbo.sh
```

### Issue: "turbo.json not found" error in Vercel logs

**Diagnosis**:
The `cd ../..` prefix is missing or incorrect.

**Fix**:
Ensure Vercel "Ignored Build Step" starts with `cd ../..` to change from `apps/[app]/` to monorepo root.

### Issue: "The provided path does not exist" error

**Symptom**:
```
Error: The provided path "~/code/kstorybridge/apps/dashboard/app/dashboard" does not exist
```

**Root Cause**: You're running `vercel` from the app directory (e.g., `apps/dashboard/`), but the Vercel project has `Root Directory` set to `apps/dashboard`. Vercel combines them, looking for `apps/dashboard/apps/dashboard` which doesn't exist.

**Solution**: Deploy from the **monorepo root**, not from the app directory:
```bash
cd /Users/sungholee/code/kstorybridge
vercel link --project dashboard-staging --yes
vercel --prod
```

**Also check**: Make sure `Root Directory` in Vercel Dashboard is `apps/dashboard` (with 's'), not `app/dashboard` (common typo).

### Issue: Wrong app building (e.g., "turbo-ignore creator" for dashboard-staging)

**Symptom**: Build log shows wrong app name in turbo-ignore command.

**Root Cause**: Vercel Dashboard "Ignored Build Step" has wrong parameter or wrong project linked.

**Solution**:
1. Go to Vercel Dashboard → Project Settings → Git
2. Check "Ignored Build Step" setting
3. Either set to `Automatic` or fix the parameter to match the app

---

## Best Practices

### ✅ DO

- **Test in staging first** - Always deploy to staging before production
- **Use manual staging deploys** - Take time to test, don't rush
- **Check deployment URLs** - Verify the staging URL before sharing
- **Review build logs** - Use `--logs` flag to catch build errors
- **Tag production releases** - Use git tags for production deployments
- **Monitor first production deploy** - Watch the auto-deploy on first main push

### ❌ DON'T

- **Skip staging** - Never push directly to main without staging test
- **Deploy without testing** - Always test the build locally first (`npm run build`)
- **Force deploy production** - Let turbo-ignore handle production (unless emergency)
- **Ignore build failures** - Investigate why staging build failed before deploying
- **Forget to pull** - Always `git pull origin v2` before deploying staging

---

## Configuration File Locations

**Deployment Configuration**:
- `/scripts/vercel-ignore-turbo.sh` - Enhanced selective deployment script
- `/apps/creator/vercel.json` - Creator app Vercel config (git settings)
- `/apps/dashboard/vercel.json` - Dashboard app Vercel config (git settings)
- `/apps/creator/turbo.json` - Creator workspace detection
- `/apps/dashboard/turbo.json` - Dashboard workspace detection
- `/apps/website/turbo.json` - Website workspace detection

**Root Configuration**:
- `/turbo.json` - Root Turborepo pipeline config
- `/package.json` - Monorepo scripts and dependencies

**Documentation**:
- `/MANUAL_DEPLOYMENT_GUIDE.md` - This file
- `/docs/guides/DEPLOYMENT_INSTRUCTIONS.md` - Vercel setup guide
- `/docs/guides/TURBOREPO_VERCEL_SETUP.md` - Turborepo integration guide

---

## FAQ

### Q: Why disable staging auto-deploy?

**A:** Staging auto-deploy causes unnecessary builds and costs. Manual control lets you:
- Test locally first before deploying
- Deploy only when ready for testing
- Save Vercel build minutes
- Avoid queuing 6 projects on every push

### Q: What happens if I merge v2 to main?

**A:** Only changed apps auto-deploy to production (via turbo-ignore). Unchanged apps skip build.

### Q: Can I enable staging auto-deploy later?

**A:** Yes, just change `vercel.json`:
```json
{
  "git": {
    "deploymentEnabled": {
      "v2": true,   // Enable staging auto-deploy
      "main": true
    }
  }
}
```

### Q: How do I deploy multiple apps at once?

**A:** Use a script:
```bash
#!/bin/bash
cd apps/creator && vercel --yes &
cd apps/dashboard && vercel --yes &
cd apps/website && vercel --yes &
wait
echo "All deployments started"
```

### Q: Does this work with GitHub Actions / CI?

**A:** Yes, the Vercel CLI works in CI. Example GitHub Actions workflow:
```yaml
- name: Deploy to Vercel
  run: |
    cd apps/creator
    vercel --token=${{ secrets.VERCEL_TOKEN }} --yes
```

---

## Summary

**Staging Workflow** (v2 branch):
1. Push changes to v2 branch
2. No auto-deploy happens
3. Manually run `vercel` in app directory when ready
4. Test staging deployment
5. Merge to main when ready

**Production Workflow** (main branch):
1. Merge v2 → main
2. Auto-deploy runs (only for changed apps)
3. turbo-ignore skips unchanged apps
4. Monitor deployment in Vercel dashboard

**Emergency Manual Deploy**:
```bash
cd apps/[app]
vercel --prod --yes --logs
```

---

For questions or issues:
- Check Vercel deployment logs first
- Review this guide's troubleshooting section
- Check `/docs/guides/DEPLOYMENT_INSTRUCTIONS.md` for Vercel setup
- Review Turborepo docs: `/docs/guides/TURBOREPO_VERCEL_SETUP.md`
