# Creator V2 - Deployment Guide

**Target URL**: https://creator.kstorybridge.com
**Vercel Project**: TBD (to be created)
**Last Updated**: 2025-10-24

---

## 🚀 Quick Deploy

### Option 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# From project root
cd apps/creator-v2

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Option 2: Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import Git Repository: `kstorybridge`
4. Configure project (see configuration section below)
5. Click "Deploy"

---

## ⚙️ Vercel Project Configuration

### Build Settings
```
Framework Preset: Vite
Root Directory: apps/creator-v2
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node Version: 18.x (or latest LTS)
```

### Environment Variables

**Required Variables** (add in Vercel Dashboard → Settings → Environment Variables):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.sVL5kYyqFTvvJH7jR_DYKQjHDKHqfJ9sE2xPQBmrqkI

# Application URL (Production)
VITE_APP_URL=https://creator.kstorybridge.com
```

**Important**: Set for all environments (Production, Preview, Development)

---

## 🔐 OAuth Configuration

### 1. Google OAuth Console

**Access**: [Google Cloud Console → APIs & Credentials](https://console.cloud.google.com/apis/credentials)

**Add Authorized Redirect URIs:**
1. Select your OAuth 2.0 Client ID
2. Under "Authorized redirect URIs", add:
   ```
   https://creator.kstorybridge.com/auth/callback
   https://creator-v2-*.vercel.app/auth/callback
   ```
3. Click "Save"

### 2. Supabase Auth Settings

**Access**: [Supabase Dashboard → Authentication → URL Configuration](https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd/auth/url-configuration)

**Add Redirect URLs:**
1. In "Redirect URLs" section, add:
   ```
   https://creator.kstorybridge.com/auth/callback
   https://creator-v2-*.vercel.app/auth/callback
   ```
2. Set "Site URL" to:
   ```
   https://creator.kstorybridge.com
   ```
3. Click "Save"

**Important**: Wildcard `*` allows all Vercel preview deployments to work

---

## 🌐 DNS Configuration

### Add Custom Domain

**In Vercel Dashboard:**
1. Go to Project Settings → Domains
2. Click "Add Domain"
3. Enter: `creator.kstorybridge.com`
4. Click "Add"

**Vercel will provide DNS records. Add them to your domain registrar:**

**Option A: CNAME Record (Recommended)**
```
Type: CNAME
Name: creator
Value: cname.vercel-dns.com
TTL: 3600
```

**Option B: A Record**
```
Type: A
Name: creator
Value: [IP address provided by Vercel]
TTL: 3600
```

**DNS Propagation**: Wait 5-30 minutes for DNS to propagate globally.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [x] `vercel.json` exists in `apps/creator-v2/`
- [x] `.vercelignore` exists in `apps/creator-v2/`
- [ ] `.env.local` is NOT committed to git
- [ ] All environment variables documented
- [ ] Build succeeds locally (`npm run build`)
- [ ] No console errors in local development
- [ ] OAuth callbacks documented

**Test Local Build:**
```bash
cd apps/creator-v2
npm run build
npm run preview
# Visit http://localhost:4173 and test
```

---

## 🧪 Staging Deployment (Optional)

### Create Staging Branch
```bash
git checkout -b creator-v2-staging
git push origin creator-v2-staging
```

### Configure in Vercel
1. Vercel Dashboard → Project Settings → Git
2. Enable automatic deployments for `creator-v2-staging` branch
3. Staging URL will be: `creator-v2-staging-*.vercel.app`

### Use Staging For:
- Testing OAuth in production environment
- QA before production release
- Demo to stakeholders

---

## ✅ Post-Deployment Verification

### Automated Checks
- [ ] Vercel build succeeds (green checkmark)
- [ ] Deployment preview loads successfully
- [ ] No build warnings or errors

### Manual Testing Checklist

**1. Basic Access**
- [ ] Visit https://creator.kstorybridge.com
- [ ] Page loads without errors
- [ ] HTTPS certificate valid (green padlock)
- [ ] No mixed content warnings

**2. Authentication**
- [ ] Email signup works
- [ ] Email signin works
- [ ] Google OAuth signup works
- [ ] Google OAuth signin works
- [ ] Session persists after page reload

**3. Features**
- [ ] Title list loads
- [ ] Can create new title
- [ ] Can edit existing title
- [ ] Can view title details
- [ ] Profile page loads
- [ ] Profile editing works

**4. UI/UX**
- [ ] Mobile responsive (test on phone)
- [ ] Tablet responsive
- [ ] Desktop layout correct
- [ ] Navigation works (sidebar)
- [ ] Protected routes redirect correctly

**5. Console Checks**
- [ ] No errors in browser console (F12)
- [ ] No failed network requests
- [ ] No CORS errors
- [ ] Auth logs show single listener

---

## 🚨 Rollback Plan

### If Deployment Fails

**Immediate Rollback (Instant):**
1. Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"
4. Previous version restored immediately

**Or Disable Custom Domain:**
1. Vercel Dashboard → Domains
2. Remove `creator.kstorybridge.com` temporarily
3. Debug issues using Vercel preview URL
4. Re-add domain when fixed

---

## 🔍 Troubleshooting

### Build Fails
**Symptom**: Vercel build fails with errors
**Solutions**:
- Check build logs in Vercel dashboard
- Test `npm run build` locally
- Verify all dependencies installed
- Check Node.js version (should be 18.x+)

### OAuth Not Working
**Symptom**: OAuth signup/signin hangs or fails
**Solutions**:
- Verify OAuth callbacks added to Google Console
- Verify OAuth callbacks added to Supabase
- Check callback URL format (no trailing slash)
- Test with `https://` (not `http://`)

### 404 on Routes
**Symptom**: Direct URL navigation returns 404
**Solutions**:
- Verify `vercel.json` rewrites configured
- Check `rewrites` array includes catch-all
- Test local preview build

### Environment Variables Not Working
**Symptom**: App can't connect to Supabase
**Solutions**:
- Check variables start with `VITE_`
- Verify variables set in Vercel dashboard
- Redeploy after adding variables
- Check variables are set for correct environment

---

## 📊 Monitoring

### Post-Deployment Monitoring

**Vercel Analytics** (if enabled):
- Page load times
- Error rates
- Traffic patterns

**Supabase Logs**:
- Auth events
- Database queries
- Edge function calls

**Browser Console** (user reports):
- JavaScript errors
- Network failures
- Auth issues

---

## 🔄 Deployment Workflow

### For Future Updates

**Development → Staging → Production:**

1. **Develop locally**
   ```bash
   cd apps/creator-v2
   npm run dev
   # Test changes on localhost:8083
   ```

2. **Deploy to staging** (optional)
   ```bash
   git checkout creator-v2-staging
   git merge v2
   git push origin creator-v2-staging
   # Vercel auto-deploys to staging URL
   ```

3. **Test staging**
   - Verify all features work
   - Test OAuth in production environment
   - Get approval from stakeholders

4. **Deploy to production**
   ```bash
   git checkout v2
   # or main, depending on strategy
   git push origin v2
   # Vercel auto-deploys to creator.kstorybridge.com
   ```

---

## 📞 Support

### If Issues Arise

**Vercel Support**:
- Dashboard → Help → Support
- Or: support@vercel.com

**Supabase Support**:
- Dashboard → Help & Support
- Or: support@supabase.io

**Internal Team**:
- Check deployment logs in Vercel
- Review Supabase logs
- Test locally to reproduce

---

## 🎯 Success Criteria

Deployment is successful when:
- ✅ App accessible at https://creator.kstorybridge.com
- ✅ HTTPS enabled (green padlock)
- ✅ Email auth works
- ✅ OAuth auth works (Google)
- ✅ All features functional
- ✅ Mobile responsive
- ✅ No console errors
- ✅ DNS resolves correctly
- ✅ Session persistence works

---

## 📝 Deployment History

| Date | Version | Deployed By | Notes |
|------|---------|-------------|-------|
| TBD | 2.0 | TBD | Initial V2 deployment |

---

**Last Updated**: 2025-10-24
**Maintainer**: KStoryBridge Team
**Status**: Ready for Deployment ✅
