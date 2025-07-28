# Vercel Deployment Guide

This guide explains how to properly deploy both applications to Vercel with correct cross-domain authentication.

## Step 1: Deploy Both Applications

1. **Deploy Website App**:
   - Go to Vercel dashboard
   - Import `apps/website` directory
   - Deploy and note the URL (e.g., `https://kstorybridge-website.vercel.app`)

2. **Deploy Dashboard App**:
   - Go to Vercel dashboard  
   - Import `apps/dashboard` directory
   - Deploy and note the URL (e.g., `https://kstorybridge-dashboard.vercel.app`)

## Step 2: Configure Environment Variables

### For Website Deployment:
In Vercel dashboard → Your Website Project → Settings → Environment Variables:

```
VITE_DASHBOARD_URL=https://your-dashboard-app.vercel.app
VITE_WEBSITE_URL=https://your-website-app.vercel.app
```

### For Dashboard Deployment:
In Vercel dashboard → Your Dashboard Project → Settings → Environment Variables:

```
VITE_WEBSITE_URL=https://your-website-app.vercel.app  
VITE_DASHBOARD_URL=https://your-dashboard-app.vercel.app
```

## Step 3: Redeploy

After setting environment variables, trigger a new deployment for both apps to pick up the new environment variables.

## Step 4: Update Supabase Configuration

In your Supabase project settings, update the allowed redirect URLs to include both your Vercel URLs:

- `https://your-website-app.vercel.app/**`
- `https://your-dashboard-app.vercel.app/**`

## Alternative: Use Custom Domains

If you have custom domains set up in Vercel:

### Website Environment Variables:
```
VITE_DASHBOARD_URL=https://dashboard.kstorybridge.com
VITE_WEBSITE_URL=https://kstorybridge.com
```

### Dashboard Environment Variables:
```
VITE_WEBSITE_URL=https://kstorybridge.com
VITE_DASHBOARD_URL=https://dashboard.kstorybridge.com
```

## Troubleshooting

- **404 Errors**: Make sure `vercel.json` files exist in both app directories
- **DEPLOYMENT_NOT_FOUND**: Check that environment variable URLs match actual deployment URLs
- **Auth Issues**: Verify Supabase redirect URLs include your deployment domains
- **CORS Issues**: Ensure both apps are deployed and environment variables are set correctly