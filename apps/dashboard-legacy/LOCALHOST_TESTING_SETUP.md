# Localhost OAuth Testing Environment Setup

This guide sets up a complete localhost environment for testing OAuth authentication flows without redirecting to production.

## 🎯 Overview

You can test in two modes:
1. **Local Supabase + Local Apps** (fully isolated)
2. **Production Supabase + Local Apps** (hybrid testing)

## 🚀 Option 1: Fully Local Environment (Recommended)

### Step 1: Start Local Supabase
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Start local Supabase stack
cd supabase
npx supabase start

# This will show URLs like:
# API URL: http://localhost:54321
# Studio URL: http://localhost:54324
# anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Configure Local Environment
Edit `.env.local`:
```bash
# Uncomment these lines for local Supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4ODIsImV4cCI6MTk2MDc2ODg4Mn0.cDaGHQZYiY4AjeLrNMOdDMX5AxA2yFnGNm7XPGGNcME

# Keep these for app URLs
VITE_DASHBOARD_URL=http://localhost:8081
VITE_WEBSITE_URL=http://localhost:5173
VITE_LOCAL_TESTING=true
VITE_OAUTH_TESTING=true
VITE_AUTH_DEBUG=true
```

### Step 3: Set Up OAuth Providers (Local)
1. **Access Local Studio**: `http://localhost:54324`
2. **Go to Authentication > Providers**
3. **Configure OAuth providers** with localhost redirect URLs:
   - Redirect URL: `http://localhost:8081/auth/callback`
   - Site URL: `http://localhost:8081`

### Step 4: Run Both Apps
```bash
# Terminal 1: Dashboard
cd apps/dashboard
npm run dev

# Terminal 2: Website  
cd apps/website
npm run dev
```

## 🔄 Option 2: Hybrid Testing (Production Data + Local Apps)

If you want to test with production data but local apps:

### Step 1: Configure Environment
Keep `.env.local` as:
```bash
VITE_DASHBOARD_URL=http://localhost:8081
VITE_WEBSITE_URL=http://localhost:5173
VITE_LOCAL_TESTING=true
VITE_OAUTH_TESTING=true
VITE_AUTH_DEBUG=true

# Don't set VITE_SUPABASE_URL - will use production
```

### Step 2: Update Production OAuth Settings
In your Supabase dashboard (production):
1. **Go to Authentication > URL Configuration**
2. **Add localhost redirect URLs**:
   - `http://localhost:8081/auth/callback`
   - `http://localhost:5173/auth/callback`

## 🧪 Testing OAuth Flows

### Creator Signup Test
1. **Go to**: `http://localhost:5173/signup/creator`
2. **Click OAuth provider** (Google/GitHub)  
3. **Complete OAuth flow**
4. **Should redirect to**: `http://localhost:8081/creators/home`

### Buyer Signup Test
1. **Go to**: `http://localhost:5173/signup/buyer`
2. **Click OAuth provider**
3. **Complete OAuth flow**
4. **Should redirect to**: `http://localhost:8081/buyers/home`

## 🐛 Debugging

### Check Configuration
The browser console will show:
```
🗄️ Supabase Client Configuration: {
  url: "http://localhost:54321", // or production URL
  isLocal: true,
  keyPrefix: "eyJhbGciOiJIUzI1NiIsI...",
  mode: "development"
}
```

### Common Issues & Solutions

**Issue**: OAuth redirects to production
**Solution**: Ensure OAuth providers are configured with localhost URLs

**Issue**: "Account type undefined"
**Solution**: Check the signup URL includes `?account_type=creator` parameter

**Issue**: Database connection errors
**Solution**: Verify local Supabase is running and migrations are applied

**Issue**: Edge Functions not working
**Solution**: Deploy functions to local Supabase or use production functions URL

## 📝 Environment Variables Reference

| Variable | Purpose | Local Value | Production Value |
|----------|---------|-------------|------------------|
| `VITE_SUPABASE_URL` | Supabase API URL | `http://localhost:54321` | `https://dlrnrgcoguxlkkcitlpd.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Local generated key | Production key |
| `VITE_DASHBOARD_URL` | Dashboard app URL | `http://localhost:8081` | `https://dashboard.kstorybridge.com` |
| `VITE_WEBSITE_URL` | Website app URL | `http://localhost:5173` | `https://kstorybridge.com` |
| `VITE_LOCAL_TESTING` | Enable local mode | `true` | `false` |
| `VITE_OAUTH_TESTING` | OAuth debug mode | `true` | `false` |
| `VITE_AUTH_DEBUG` | Auth debug logs | `true` | `false` |

## 🔧 Advanced Configuration

### Custom Local Domains
Add to `/etc/hosts`:
```
127.0.0.1 kstorybridge.local
127.0.0.1 dashboard.kstorybridge.local
```

Then use:
```bash
VITE_WEBSITE_URL=http://kstorybridge.local:5173
VITE_DASHBOARD_URL=http://dashboard.kstorybridge.local:8081
```

### Mock Data Testing
Enable mock data mode:
```bash
VITE_USE_MOCK_DATA=true
```

This bypasses real API calls for faster testing.

## 🎉 Success Indicators

When properly configured, you should see:
- ✅ Local Supabase Studio accessible at `localhost:54324`
- ✅ Console shows local Supabase URL in client config
- ✅ OAuth redirects to localhost after authentication
- ✅ Creator profiles created automatically via Edge Functions
- ✅ Proper routing to `/creators/home` or `/buyers/home`

## 🔄 Switching Back to Production

To switch back to production testing:
1. Comment out local Supabase vars in `.env.local`
2. Set `VITE_LOCAL_TESTING=false`
3. Remove localhost URLs from production OAuth settings