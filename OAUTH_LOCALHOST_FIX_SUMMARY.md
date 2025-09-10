# OAuth Localhost Redirect Fix Summary

## Problem
User was getting redirected to production (`https://dashboard.kstorybridge.com`) after OAuth signup on localhost:8081, instead of staying on localhost.

## Root Causes Identified

### 1. Port Mismatch in Environment Files
- **Dashboard `.env.local`**: Had port 8083, but Vite config was set to port 8081
- **Website `.env.local`**: Also had mismatched port 8083

### 2. Build Process Not Using Environment Variables
- Website builds were using production URLs because environment variables weren't set during build time
- `.env.local` files are not automatically loaded by npm build scripts

### 3. Our Previous OAuth Metadata Fix
- The AuthCallbackPage fix we implemented was correctly setting account_type metadata
- But users were still being redirected to production due to the hardcoded URLs in the built website

## Solutions Implemented

### 1. Fixed Environment Configuration
```bash
# Updated apps/dashboard/.env.local
VITE_DASHBOARD_URL=http://localhost:8081  # was 8083
VITE_WEBSITE_URL=http://localhost:5173    # was 5174

# Updated apps/website/.env.local  
VITE_DASHBOARD_URL=http://localhost:8081  # was 8083
VITE_WEBSITE_URL=http://localhost:5173    # was 5174
```

### 2. Rebuilt Website with Correct Environment Variables
```bash
# Build with explicit environment variable
VITE_DASHBOARD_URL=http://localhost:8081 npm run build
```

### 3. Verified Source Code Uses Centralized Configuration
- Website source code already correctly uses `getDashboardUrl()` from `src/config/urls.ts`
- AuthSection component uses `getDashboardUrl()` for sign-in redirects
- Button onClick handlers use `import.meta.env.VITE_DASHBOARD_URL || 'fallback'`

## Key Files Modified

1. **Environment Files**:
   - `/apps/dashboard/.env.local` - Fixed port from 8083 to 8081
   - `/apps/website/.env.local` - Fixed port from 8083 to 8081

2. **Previous OAuth Metadata Fix** (already implemented):
   - `/apps/dashboard/src/pages/AuthCallbackPage.tsx` - Sets account_type from URL params

3. **Built Assets** (regenerated):
   - Website dist files now contain `localhost:8081` instead of `dashboard.kstorybridge.com`

## How OAuth Flow Works Now

1. **User starts OAuth on website** (`localhost:5173`)
   - Website buttons now redirect to `localhost:8081` instead of production
   
2. **OAuth callback returns to dashboard** (`localhost:8081/auth/callback?account_type=ip_owner`)
   - AuthCallbackPage extracts `account_type` from URL and updates user metadata
   - Account type detection finds correct type in metadata
   
3. **User gets redirected appropriately**:
   - Creators → `/creators/home/` or `/signup/creator` (on localhost:8081)
   - Buyers → `/buyers/titles` or `/signup/buyer` (on localhost:8081)

## Testing Commands

To verify the fix:
```bash
# Start website (from root directory)
npm run dev:website

# Start dashboard (from root directory) 
npm run dev:dashboard

# Test OAuth flow:
# 1. Go to http://localhost:5173
# 2. Click any signup button
# 3. Should redirect to localhost:8081 instead of production
```

## Build Commands for Production
When deploying, ensure environment variables are set:

```bash
# For production builds
VITE_DASHBOARD_URL=https://dashboard.kstorybridge.com npm run build

# For local testing builds  
VITE_DASHBOARD_URL=http://localhost:8081 npm run build
```

## Environment Variable Priority
The `getDashboardUrl()` function uses this priority:
1. `VITE_DASHBOARD_URL` environment variable (highest priority)
2. `import.meta.env.DEV` detection → `http://localhost:8081`
3. Hostname detection for Vercel deployments
4. Production fallback → `https://dashboard.kstorybridge.com`

This fix ensures that:
- ✅ OAuth signup stays on localhost during development
- ✅ Production builds still work correctly
- ✅ No hardcoded URLs in source code
- ✅ Flexible configuration for different environments