# Deployment Strategy - KStoryBridge Monorepo

**Last Updated**: 2025-10-21

## Three-Tier Environment Architecture

KStoryBridge uses a three-tier deployment strategy with separate environments for development, staging, and production.

### Environment Mapping

| Environment | Git Branch | Domain | Apps Deployed |
|-------------|------------|--------|---------------|
| **Development** | (local) | localhost:8081 | Dashboard, Website |
| **Staging** | v2 | staging.kstorybridge.com | Dashboard only |
| **Production** | main | dashboard.kstorybridge.com | Dashboard, Website |

## Branch Deployment Rules

### Development Workflow (UPDATED 2025-10-21)

**Primary Working Directory**: `/Users/sungholee/code/kstorybridge`
- Work exclusively on `v2` branch for all development
- Test in staging environment before merging to `main`
- Merge `v2` → `main` only when staging is stable

**Archive Directories** (reference only):
- `/Users/sungholee/code/kstorybridge-v2/` - Independent archive of v2 state
- `/Users/sungholee/code/kstorybridge-monorepo/` - Independent archive of main state

### v2 Branch → Staging (dashboard-staging only)

**Deployments Enabled:**
- ✅ **dashboard-staging** - Dashboard app deployed to staging.kstorybridge.com

**Deployments Disabled:**
- ❌ **kstorybridge-dashboard** - Skip v2 branch (only build main)
- ❌ **kstorybridge-website** - Skip v2 branch (only build main)

### main Branch → Production (all apps)

**Deployments Enabled:**
- ✅ **kstorybridge-dashboard** - Dashboard app (production)
- ✅ **kstorybridge-website** - Marketing website

## Vercel Configuration Instructions

### Problem

When pushing to the v2 branch, Vercel currently triggers deployments for **all projects**, causing unnecessary builds:

```
v2 push → dashboard-staging ✅ (desired)
         → kstorybridge-dashboard ❌ (duplicate, unwanted)
         → kstorybridge-website ❌ (unwanted)
```

### Solution: Ignored Build Step Configuration

Configure each Vercel project to skip builds for the v2 branch using **Ignored Build Step** commands.

---

## Prerequisites (CRITICAL) 🚨

### Root Directory Configuration for Monorepo

**⚠️ MUST BE CONFIGURED FIRST**: Each Vercel project needs to know which app directory to build from.

**Without this configuration, builds will fail with**:
```
error during build:
Could not resolve entry module "index.html"
```

**Required Configuration for Each Project**:

| Vercel Project | Root Directory Setting |
|----------------|------------------------|
| dashboard-staging | `apps/dashboard` |
| kstorybridge-dashboard | `apps/dashboard` |
| kstorybridge-website | `apps/website` |

**How to Configure**:
1. Go to each Vercel project → Settings → General
2. Find "Root Directory" section
3. Click "Edit"
4. Enter the appropriate path from table above
5. Click "Save"

**Why this is needed**: The monorepo structure has apps in subdirectories:
```
kstorybridge-v2/
├── apps/
│   ├── dashboard/   ← index.html is here
│   └── website/     ← index.html is here
└── (root - NO index.html here)
```

**See detailed instructions**: `VERCEL_ROOT_DIRECTORY_FIX.md`

---

## Step-by-Step Configuration

### 1. Configure dashboard-staging (Build on v2 and main)

**Vercel Dashboard:**
1. Go to: dashboard-staging project → Settings → Git
2. **Ignored Build Step**: Leave empty (build all branches)
3. **Production Branch**: `v2`
4. **Custom Domain**: `staging.kstorybridge.com`

**Environment Variables:**
- Use `.env.staging` values (already configured)
- Key variables:
  - `VITE_DASHBOARD_URL=https://staging.kstorybridge.com`
  - `VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co`
  - `VITE_OPENAI_ENABLED=true`
  - `VITE_DEBUG_MODE=true`

---

### 2. Configure kstorybridge-dashboard (Skip v2, build main only)

**Vercel Dashboard:**
1. Go to: kstorybridge-dashboard project → Settings → Git
2. **Ignored Build Step**: Enter this command:
   ```bash
   if [ "$VERCEL_GIT_COMMIT_REF" = "v2" ]; then exit 0; else exit 1; fi
   ```
3. **Production Branch**: `main`

**How it works:**
- If branch is `v2` → exit 0 (skip build)
- If branch is NOT `v2` (e.g., `main`) → exit 1 (proceed with build)

---

### 3. Configure kstorybridge-website (Skip v2, build main only)

**Vercel Dashboard:**
1. Go to: kstorybridge-website project → Settings → Git
2. **Ignored Build Step**: Enter this command:
   ```bash
   if [ "$VERCEL_GIT_COMMIT_REF" = "v2" ]; then exit 0; else exit 1; fi
   ```
3. **Production Branch**: `main`

---

## Vercel Environment Variables

### Ignored Build Step Command Reference

**Skip v2 branch (build main only):**
```bash
if [ "$VERCEL_GIT_COMMIT_REF" = "v2" ]; then exit 0; else exit 1; fi
```

**Skip multiple branches:**
```bash
if [ "$VERCEL_GIT_COMMIT_REF" = "v2" ] || [ "$VERCEL_GIT_COMMIT_REF" = "dev" ]; then exit 0; else exit 1; fi
```

**Build only specific branch:**
```bash
if [ "$VERCEL_GIT_COMMIT_REF" != "main" ]; then exit 0; else exit 1; fi
```

### Available Vercel Environment Variables

- `VERCEL_GIT_COMMIT_REF` - Branch name (e.g., "v2", "main")
- `VERCEL_GIT_COMMIT_SHA` - Git commit hash
- `VERCEL_ENV` - Deployment environment (production, preview, development)
- `VERCEL_URL` - Deployment URL

## Deployment Workflow

### Staging Deployment (v2 branch)

```bash
# Make changes in v2 branch
git checkout v2
git add .
git commit -m "feat: new feature"

# Push to trigger staging deployment (dashboard-staging only)
git push origin v2
```

**Result:**
- ✅ dashboard-staging builds and deploys to staging.kstorybridge.com
- ❌ Other projects skip build (v2 ignored)

### Production Deployment (main branch)

```bash
# Merge v2 into main after testing
git checkout main
git merge v2
git push origin main
```

**Result:**
- ✅ All projects build and deploy to production domains
- Dashboard → dashboard.kstorybridge.com
- Website → kstorybridge.com

## Testing Checklist

After configuring Vercel projects, verify the setup:

### Test 1: Push to v2 Branch

```bash
git checkout v2
git commit --allow-empty -m "test: verify v2 deployment config"
git push origin v2
```

**Expected Result:**
- ✅ Only dashboard-staging deployment triggered
- ❌ No deployments for dashboard or website

**Verify in Vercel Dashboard:**
- Check Deployments tab for each project
- Confirm only dashboard-staging shows "Building" or "Ready"
- Other projects show no new deployments

### Test 2: Push to main Branch

```bash
git checkout main
git commit --allow-empty -m "test: verify main deployment config"
git push origin main
```

**Expected Result:**
- ✅ All production projects deploy (dashboard, website)
- ❌ dashboard-staging shows no new deployment

### Test 3: Staging Site Functionality

After v2 deployment completes, test:
- [ ] Staging site loads: `https://staging.kstorybridge.com`
- [ ] Authentication works (signin/signup)
- [ ] OAuth callbacks work properly
- [ ] Chat functionality works (Supabase Edge Functions)
- [ ] Database queries execute successfully
- [ ] No CORS errors in browser console
- [ ] Debug mode enabled (check console logs)

## Troubleshooting

### Issue: All projects still deploying on v2 push

**Solution:**
1. Verify Ignored Build Step command is saved in Vercel Dashboard
2. Check for typos in the command (copy-paste recommended)
3. Ensure command is in "Ignored Build Step" field, not "Build Command"
4. Wait 1-2 minutes for Vercel cache to clear after saving

### Issue: dashboard-staging not deploying on v2 push

**Solution:**
1. Check Production Branch is set to `v2` (not `main`)
2. Verify Ignored Build Step field is EMPTY for dashboard-staging
3. Check deployment logs for build errors
4. Verify environment variables are set correctly

### Issue: Staging deployment succeeds but site doesn't work

**Solution:**
1. Check browser console for errors
2. Verify environment variables match `.env.staging`
3. Check Supabase OAuth redirect URLs include staging domain
4. Verify Supabase Edge Functions are deployed and accessible
5. Test database connectivity (check Network tab)

### Issue: OAuth fails on staging

**Solution:**
1. Add to Supabase → Authentication → URL Configuration:
   ```
   https://staging.kstorybridge.com/auth/callback
   ```
2. Update Site URL if needed:
   ```
   https://staging.kstorybridge.com
   ```
3. Verify `VITE_DASHBOARD_URL` in Vercel environment variables

## Supabase Configuration

### Required OAuth Redirect URLs

Add all redirect URLs to Supabase Dashboard → Authentication → URL Configuration:

```
http://localhost:8081/auth/callback
https://staging.kstorybridge.com/auth/callback
https://dashboard.kstorybridge.com/auth/callback
```

### Site URL Configuration

**Production Site URL:**
```
https://dashboard.kstorybridge.com
```

### Environment-Specific Edge Functions

Supabase Edge Functions are shared across all environments:
- Same edge function URL: `https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1`
- No environment-specific configuration needed
- OpenAI API key stored in Supabase secrets (not in environment variables)

## Security Considerations

### Environment Variables

**Staging (.env.staging):**
- ✅ Uses production Supabase instance
- ✅ Debug mode enabled for troubleshooting
- ✅ Staging-specific domain URLs
- ⚠️ Same database as production (use caution with destructive operations)

**Production:**
- ✅ Debug mode disabled
- ✅ Production-optimized settings
- ✅ No test/demo accounts

### Best Practices

1. **Never commit `.env` files** - Use Vercel Dashboard for environment variables
2. **Test on staging first** - Always deploy to v2 before merging to main
3. **Use separate databases** - Consider staging database for testing (optional)
4. **Rotate secrets regularly** - Update API keys and tokens periodically
5. **Monitor deployments** - Set up Vercel deployment notifications

## Summary

### Current Configuration

✅ **Completed:**
- Three-tier environment architecture defined
- `.env.staging` configured with correct URLs
- Deployment strategy documented
- Branch mapping established

⏳ **Pending (Manual Vercel Dashboard Configuration):**
- Configure Ignored Build Step for kstorybridge-dashboard
- Configure Ignored Build Step for kstorybridge-website
- Add staging redirect URL to Supabase OAuth configuration

### Quick Reference

**To deploy only dashboard-staging on v2:**
```bash
git push origin v2  # Only dashboard-staging builds
```

**To deploy all apps to production:**
```bash
git push origin main  # All apps build and deploy
```

**Ignored Build Step command (for projects that skip v2):**
```bash
if [ "$VERCEL_GIT_COMMIT_REF" = "v2" ]; then exit 0; else exit 1; fi
```
