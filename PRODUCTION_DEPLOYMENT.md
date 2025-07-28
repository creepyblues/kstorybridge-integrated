# Production Deployment Workflow

This document outlines the development → production deployment workflow for KStoryBridge.

## Environment Overview

### Development Environment
- **Website**: https://kstorybridge-website.vercel.app
- **Dashboard**: https://kstorybridge-dashboard.vercel.app
- **Purpose**: Testing, development, debugging
- **Auto-deploys**: Yes (on every GitHub push to main)

### Production Environment
- **Website**: https://kstorybridge.com
- **Dashboard**: https://dashboard.kstorybridge.com
- **Purpose**: Live production site for users
- **Auto-deploys**: No (manual promotion only)

## Deployment Workflow

### Phase 1: Development & Testing
1. **Make changes** in your local environment
2. **Test locally** using `npm run dev`
3. **Commit and push** to GitHub main branch
4. **Auto-deployment** to `.vercel.app` domains
5. **Test thoroughly** on dev environment

### Phase 2: Production Promotion
1. **Verify dev environment** is working correctly
2. **Manually promote** deployments to production domains
3. **Test production** environment
4. **Monitor** for any issues

## Setup Instructions

### Step 1: Configure Custom Domains in Vercel

#### Website Domain Setup:
1. Go to `kstorybridge-website` project in Vercel
2. Settings → Domains
3. Add `kstorybridge.com`
4. Add `www.kstorybridge.com` (redirects to main)
5. Configure DNS as instructed by Vercel

#### Dashboard Domain Setup:
1. Go to `kstorybridge-dashboard` project in Vercel
2. Settings → Domains  
3. Add `dashboard.kstorybridge.com`
4. Configure DNS as instructed by Vercel

### Step 2: Environment Variables Configuration

#### Development Environment Variables:
Set these in Vercel dashboard for Preview/Development environments:

**Website Project**:
```
VITE_DASHBOARD_URL=https://kstorybridge-dashboard.vercel.app
VITE_WEBSITE_URL=https://kstorybridge-website.vercel.app
```

**Dashboard Project**:
```
VITE_WEBSITE_URL=https://kstorybridge-website.vercel.app
VITE_DASHBOARD_URL=https://kstorybridge-dashboard.vercel.app
```

#### Production Environment Variables:
Set these in Vercel dashboard for Production environment:

**Website Project**:
```
VITE_DASHBOARD_URL=https://dashboard.kstorybridge.com
VITE_WEBSITE_URL=https://kstorybridge.com
```

**Dashboard Project**:
```
VITE_WEBSITE_URL=https://kstorybridge.com
VITE_DASHBOARD_URL=https://dashboard.kstorybridge.com
```

### Step 3: Update Supabase Configuration

Add both development and production URLs to Supabase:

**Authentication → URL Configuration → Redirect URLs**:
```
# Development
https://kstorybridge-website.vercel.app/**
https://kstorybridge-dashboard.vercel.app/**

# Production  
https://kstorybridge.com/**
https://dashboard.kstorybridge.com/**
```

## Deployment Process

### For Regular Development:
1. Make changes and push to GitHub
2. Changes auto-deploy to `.vercel.app` domains
3. Test on development environment

### For Production Release:
1. **Ensure dev environment is stable**
2. **Go to Vercel Dashboard**
3. **For Website**:
   - Go to `kstorybridge-website` project
   - Find the deployment you want to promote
   - Click "..." → "Promote to Production"
4. **For Dashboard**:
   - Go to `kstorybridge-dashboard` project  
   - Find the same deployment timestamp
   - Click "..." → "Promote to Production"
5. **Test production domains**
6. **Monitor for issues**

## Rollback Process

If issues are found in production:

1. **Go to previous stable deployment** in Vercel
2. **Promote the previous version** to production
3. **Fix issues** in development
4. **Re-promote** when ready

## Monitoring

### Development Environment:
- Use for all testing and debugging
- Check console logs frequently
- Test all authentication flows

### Production Environment:
- Monitor user reports
- Check error tracking (if implemented)
- Verify authentication flows work
- Monitor performance

## Best Practices

1. **Always test on dev first** before promoting to production
2. **Promote both apps together** to maintain compatibility
3. **Keep environment variables in sync**
4. **Test cross-domain authentication** after domain changes
5. **Have a rollback plan** ready