# Vercel Configuration Guide - Selective v2 Deployments

**Goal**: Configure Vercel to deploy only `dashboard-staging` when pushing to v2 branch.

**Time Required**: ~10 minutes

---

## Quick Setup Checklist

- [ ] **Step 0**: 🚨 Configure Root Directory (CRITICAL - Do First!) - 5 min
- [ ] **Step 1**: Configure dashboard-staging (build on v2) - 2 min
- [ ] **Step 2**: Configure kstorybridge-dashboard (skip v2) - 2 min
- [ ] **Step 3**: Configure kstorybridge-integrated-admin (skip v2) - 2 min
- [ ] **Step 4**: Configure kstorybridge-website (skip v2) - 2 min
- [ ] **Step 5**: Update Supabase OAuth URLs - 2 min
- [ ] **Step 6**: Test deployment - 5 min

---

## Step 0: Configure Root Directory (CRITICAL) 🚨

**⚠️ MUST DO FIRST**: In a monorepo, Vercel needs to know which app directory to build from. Without this, builds will fail with "Could not resolve entry module 'index.html'".

### For ALL Four Projects:

#### 0.1 dashboard-staging
```
Settings → General → Root Directory
├─ Click: Edit
├─ Enter: apps/dashboard
└─ Click: Save
```

#### 0.2 kstorybridge-dashboard
```
Settings → General → Root Directory
├─ Click: Edit
├─ Enter: apps/dashboard
└─ Click: Save
```

#### 0.3 kstorybridge-integrated-admin
```
Settings → General → Root Directory
├─ Click: Edit
├─ Enter: apps/admin
└─ Click: Save
```

#### 0.4 kstorybridge-website
```
Settings → General → Root Directory
├─ Click: Edit
├─ Enter: apps/website
└─ Click: Save
```

**Why this is needed**: The repository structure is:
```
kstorybridge-v2/
├── apps/
│   ├── dashboard/   ← Vercel needs to build from here
│   ├── admin/       ← Vercel needs to build from here
│   └── website/     ← Vercel needs to build from here
└── (root - NO index.html here)
```

---

## Step 1: Configure dashboard-staging

### Vercel Dashboard → dashboard-staging Project

**1.1 Git Settings**
```
Settings → Git
├─ Production Branch: v2
├─ Ignored Build Step: [Leave empty]
└─ Custom Domains: staging.kstorybridge.com
```

**1.2 Environment Variables**
```
Settings → Environment Variables → Preview (v2 branch)

VITE_DASHBOARD_URL=https://staging.kstorybridge.com
VITE_WEBSITE_URL=https://staging.kstorybridge.com
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA
VITE_OPENAI_ENABLED=true
VITE_DEBUG_MODE=true
```

---

## Step 2: Configure kstorybridge-dashboard

### Vercel Dashboard → kstorybridge-dashboard Project

**2.1 Git Settings**
```
Settings → Git
├─ Production Branch: main
└─ Ignored Build Step: [Enter command below]
```

**2.2 Ignored Build Step Command**

Copy and paste this command exactly:

```bash
if [ "$VERCEL_GIT_COMMIT_REF" = "v2" ]; then exit 0; else exit 1; fi
```

**What this does:**
- If branch is `v2` → Exit 0 (skip build) ❌
- If branch is NOT `v2` (e.g., `main`) → Exit 1 (build) ✅

**2.3 Save Changes**
- Click "Save" button
- Verify command appears in the field

---

## Step 3: Configure kstorybridge-integrated-admin

### Vercel Dashboard → kstorybridge-integrated-admin Project

**3.1 Git Settings**
```
Settings → Git
├─ Production Branch: main
└─ Ignored Build Step: [Enter command below]
```

**3.2 Ignored Build Step Command**

Copy and paste this command exactly:

```bash
if [ "$VERCEL_GIT_COMMIT_REF" = "v2" ]; then exit 0; else exit 1; fi
```

**3.3 Save Changes**
- Click "Save" button
- Verify command appears in the field

---

## Step 4: Configure kstorybridge-website

### Vercel Dashboard → kstorybridge-website Project

**4.1 Git Settings**
```
Settings → Git
├─ Production Branch: main
└─ Ignored Build Step: [Enter command below]
```

**4.2 Ignored Build Step Command**

Copy and paste this command exactly:

```bash
if [ "$VERCEL_GIT_COMMIT_REF" = "v2" ]; then exit 0; else exit 1; fi
```

**4.3 Save Changes**
- Click "Save" button
- Verify command appears in the field

---

## Step 5: Update Supabase OAuth Configuration

### Supabase Dashboard → Your Project

**5.1 Navigate to Authentication**
```
Dashboard → Authentication → URL Configuration
```

**5.2 Add Redirect URLs**

Add these URLs to **Redirect URLs** field (comma-separated or one per line):

```
http://localhost:8081/auth/callback
https://staging.kstorybridge.com/auth/callback
https://dashboard.kstorybridge.com/auth/callback
```

**5.3 Update Site URL (if needed)**

```
Site URL: https://dashboard.kstorybridge.com
```

**5.4 Save Configuration**

---

## Step 6: Test Deployment

### 6.1 Test v2 Branch Deployment

**In your terminal:**

```bash
# Ensure you're on v2 branch
git checkout v2

# Create empty commit to trigger deployment
git commit --allow-empty -m "test: verify v2 deployment config"

# Push to trigger deployment
git push origin v2
```

### 6.2 Verify in Vercel Dashboard

**Expected Results:**

```
✅ dashboard-staging → Building/Ready (new deployment)
❌ kstorybridge-dashboard → No new deployment
❌ kstorybridge-integrated-admin → No new deployment
❌ kstorybridge-website → No new deployment
```

**Check each project's Deployments tab:**
1. Go to each project in Vercel Dashboard
2. Click "Deployments" tab
3. Verify only dashboard-staging has new deployment

### 6.3 Test Staging Site

**Once deployment completes, test:**

1. **Site Loads**: Visit `https://staging.kstorybridge.com`
2. **Authentication**: Try signing in
3. **OAuth**: Test Google/Kakao login
4. **Chat**: Test chat functionality
5. **Database**: Verify data loads correctly
6. **Console**: Check for errors in browser console (F12)

**Expected Console Logs (with VITE_DEBUG_MODE=true):**
```
🔧 Debug Mode: Enabled
🌐 Environment: staging
📍 Dashboard URL: https://staging.kstorybridge.com
```

---

## Troubleshooting

### ❌ Problem: All projects still deploying on v2 push

**Solution:**
1. Double-check Ignored Build Step command is saved
2. Verify no typos in command (spaces, quotes, etc.)
3. Clear browser cache and reload Vercel Dashboard
4. Wait 2-3 minutes for Vercel cache to update
5. Try pushing another commit to v2

### ❌ Problem: dashboard-staging not deploying

**Solution:**
1. Verify Production Branch is set to `v2` (not `main`)
2. Check Ignored Build Step is EMPTY for dashboard-staging
3. Check deployment logs for build errors
4. Verify Git connection is active

### ❌ Problem: Staging site loads but OAuth fails

**Solution:**
1. Verify Supabase redirect URLs include staging domain
2. Check VITE_DASHBOARD_URL environment variable
3. Ensure OAuth providers have correct callback URLs
4. Check browser console for specific OAuth error messages

### ❌ Problem: Chat doesn't work on staging

**Solution:**
1. Verify Supabase Edge Functions are accessible
2. Check VITE_SUPABASE_URL environment variable
3. Test edge function directly: `https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/chat-orchestrator`
4. Check browser Network tab for failed requests
5. Verify OpenAI API key is set in Supabase secrets (not env vars)

---

## Verification Commands

### Check Current Configuration

**Verify branch:**
```bash
git branch --show-current
```

**Check remote branches:**
```bash
git branch -r
```

**View recent commits:**
```bash
git log --oneline -5
```

### Force Redeploy

**If changes don't trigger deployment:**
```bash
# Create empty commit
git commit --allow-empty -m "chore: force redeploy"
git push origin v2
```

---

## Command Reference

### Ignored Build Step Commands

**Skip v2, build all other branches:**
```bash
if [ "$VERCEL_GIT_COMMIT_REF" = "v2" ]; then exit 0; else exit 1; fi
```

**Skip multiple branches:**
```bash
if [ "$VERCEL_GIT_COMMIT_REF" = "v2" ] || [ "$VERCEL_GIT_COMMIT_REF" = "dev" ]; then exit 0; else exit 1; fi
```

**Build only main branch:**
```bash
if [ "$VERCEL_GIT_COMMIT_REF" != "main" ]; then exit 0; else exit 1; fi
```

**Build only v2 branch:**
```bash
if [ "$VERCEL_GIT_COMMIT_REF" != "v2" ]; then exit 0; else exit 1; fi
```

### Vercel CLI Commands (Optional)

**List all projects:**
```bash
vercel projects ls
```

**View project details:**
```bash
vercel project inspect <project-name>
```

**View deployments:**
```bash
vercel deployments list
```

---

## Summary

### What You Configured

**Branch → Deployment Mapping:**

| Branch | dashboard-staging | kstorybridge-dashboard | admin | website |
|--------|-------------------|------------------------|-------|---------|
| `v2` | ✅ Deploys | ❌ Skipped | ❌ Skipped | ❌ Skipped |
| `main` | ❌ Skipped | ✅ Deploys | ✅ Deploys | ✅ Deploys |

### Deployment Commands

**Deploy staging (v2):**
```bash
git push origin v2  # Only dashboard-staging builds
```

**Deploy production (main):**
```bash
git push origin main  # All apps build
```

### Environment URLs

- **Local Development**: `http://localhost:8081`
- **Staging**: `https://staging.kstorybridge.com`
- **Production**: `https://dashboard.kstorybridge.com`

---

## Next Steps

After successful configuration:

1. ✅ Test v2 deployment (only dashboard-staging builds)
2. ✅ Verify staging site functionality
3. ✅ Test main deployment (all apps build)
4. ✅ Document any project-specific configurations
5. ✅ Set up deployment notifications (optional)
6. ✅ Create staging-specific database (optional)

---

## Support Resources

**Documentation:**
- Full deployment strategy: `DEPLOYMENT_STRATEGY.md`
- Environment configuration: `.env.staging`
- Supabase configuration: `apps/dashboard/supabase/config.toml`

**Vercel Resources:**
- [Ignored Build Step Documentation](https://vercel.com/docs/projects/overview#ignored-build-step)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Git Integration](https://vercel.com/docs/git)

**Need Help?**
- Check Vercel deployment logs for specific errors
- Review browser console for frontend errors
- Test Supabase connectivity with direct API calls
- Verify environment variables are set correctly
