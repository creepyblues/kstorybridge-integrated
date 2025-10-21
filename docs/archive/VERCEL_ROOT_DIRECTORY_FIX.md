# URGENT: Fix Vercel Build Error - Root Directory Configuration

**Error**: `Could not resolve entry module "index.html"`

**Status**: 🔴 Critical - Blocking all deployments

**Time to Fix**: 5 minutes

---

## Problem Explanation

In a monorepo, each app has its own `index.html` in a subdirectory:

```
kstorybridge-v2/
├── apps/
│   ├── dashboard/
│   │   └── index.html    ← Dashboard app entry
│   ├── admin/
│   │   └── index.html    ← Admin app entry
│   └── website/
│       └── index.html    ← Website app entry
└── (Repository root - NO index.html here)
```

**Current Issue**: Vercel is trying to run `vite build` from the repository root, where there's no `index.html`.

**Solution**: Configure each Vercel project to build from the correct app directory.

---

## Fix Instructions (Do This Now)

### Step 1: Fix kstorybridge-integrated-admin (Currently Failing)

**Vercel Dashboard:**
1. Go to: `kstorybridge-integrated-admin` project
2. Click: **Settings** → **General**
3. Scroll to: **Root Directory** section
4. Click: **Edit** button
5. Enter: `apps/admin`
6. Click: **Save**

### Step 2: Fix kstorybridge-dashboard

**Vercel Dashboard:**
1. Go to: `kstorybridge-dashboard` project
2. Click: **Settings** → **General**
3. Scroll to: **Root Directory** section
4. Click: **Edit** button
5. Enter: `apps/dashboard`
6. Click: **Save**

### Step 3: Fix kstorybridge-website

**Vercel Dashboard:**
1. Go to: `kstorybridge-website` project
2. Click: **Settings** → **General**
3. Scroll to: **Root Directory** section
4. Click: **Edit** button
5. Enter: `apps/website`
6. Click: **Save**

### Step 4: Fix dashboard-staging

**Vercel Dashboard:**
1. Go to: `dashboard-staging` project
2. Click: **Settings** → **General**
3. Scroll to: **Root Directory** section
4. Click: **Edit** button
5. Enter: `apps/dashboard`
6. Click: **Save**

---

## Trigger Redeploy

After configuring all 4 projects, trigger a redeploy:

```bash
# Ensure you're on v2 branch
git checkout v2

# Create empty commit to trigger deployment
git commit --allow-empty -m "fix: trigger redeploy after root directory config"

# Push to trigger deployment
git push origin v2
```

---

## Expected Results

### Before Fix:
```
❌ Build failed: Could not resolve entry module "index.html"
```

### After Fix:
```
✅ Cloning repository
✅ Running "vite build" from apps/admin/
✅ Build completed successfully
✅ Deployment ready
```

---

## Verification Checklist

After deploying, verify each project:

- [ ] **kstorybridge-integrated-admin**: Build succeeds, no errors
- [ ] **kstorybridge-dashboard**: Build succeeds, no errors
- [ ] **kstorybridge-website**: Build succeeds, no errors
- [ ] **dashboard-staging**: Build succeeds, deploys to staging.kstorybridge.com

---

## Root Directory Configuration Summary

| Vercel Project | Root Directory | Entry File |
|----------------|----------------|------------|
| `dashboard-staging` | `apps/dashboard` | `apps/dashboard/index.html` |
| `kstorybridge-dashboard` | `apps/dashboard` | `apps/dashboard/index.html` |
| `kstorybridge-integrated-admin` | `apps/admin` | `apps/admin/index.html` |
| `kstorybridge-website` | `apps/website` | `apps/website/index.html` |

---

## Why This Happened

**Monorepo Structure**: The repository contains 3 separate apps in subdirectories.

**Vercel Default Behavior**: By default, Vercel builds from the repository root.

**Fix Required**: Each project needs explicit Root Directory configuration to build from the correct app folder.

---

## Troubleshooting

### If build still fails after setting Root Directory:

**Check Build Command:**
1. Go to: Settings → General → Build & Development Settings
2. Verify **Build Command**: `vite build` (or `npm run build`)
3. Verify **Output Directory**: `dist`
4. Verify **Install Command**: `npm install`

**Check package.json Location:**
- Ensure `package.json` exists in the app directory
- Path should be: `apps/[app-name]/package.json`

**Clear Build Cache:**
1. Go to: Deployments tab
2. Click: **...** (three dots) on latest deployment
3. Select: **Redeploy**
4. Check: **Use existing Build Cache** → Disable
5. Click: **Redeploy**

---

## Additional Configuration Notes

### Build Settings for Each App

**Dashboard & Admin:**
```
Root Directory: apps/dashboard (or apps/admin)
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node.js Version: 18.x (or higher)
```

**Website:**
```
Root Directory: apps/website
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node.js Version: 18.x (or higher)
```

---

## Next Steps After Fix

1. ✅ Verify all 4 projects have Root Directory configured
2. ✅ Push to v2 to trigger deployments
3. ✅ Confirm only dashboard-staging builds (per ignored build step config)
4. ✅ Verify staging site works: `https://staging.kstorybridge.com`
5. ✅ Test production deployments by pushing to main

---

## Summary

**Issue**: Monorepo build failure due to missing Root Directory configuration

**Fix**: Set Root Directory for each Vercel project to the correct app folder

**Time**: 5 minutes to configure all 4 projects

**Impact**: Enables successful builds for all apps in the monorepo

After this fix, all deployments should work correctly! 🚀
