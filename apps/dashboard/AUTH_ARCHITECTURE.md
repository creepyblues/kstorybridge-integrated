# Authentication Architecture Documentation

## 🏗️ Architecture Overview

KStoryBridge uses a **split-app architecture** for authentication:

### **Website App** (Marketing)
- **URL**: `localhost:5173` (dev) / `kstorybridge.com` (prod)
- **Purpose**: Marketing pages, public content
- **Auth Role**: Redirects to Dashboard app for authentication
- **No Auth Pages**: Does not contain signup/signin pages

### **Dashboard App** (Auth + Application)  
- **URL**: `localhost:8081` (dev) / `dashboard.kstorybridge.com` (prod)
- **Purpose**: Authentication AND authenticated dashboard
- **Auth Pages**: Contains all authentication pages:
  - `/signin` - Sign in page
  - `/signup` - Generic signup redirect
  - `/signup/buyer` - Buyer signup flow
  - `/signup/creator` - Creator signup flow
  - `/auth/callback` - OAuth callback handler
  - `/forgot-password` - Password reset

## 🔄 Authentication Flow

### Standard Flow
```
1. User visits website (kstorybridge.com)
2. Clicks "Sign Up" or "Sign In"
3. Redirected to dashboard.kstorybridge.com/signup or /signin
4. Completes authentication
5. Redirected to appropriate dashboard (/buyers/home or /creators/home)
```

### OAuth Flow
```
1. User on dashboard.kstorybridge.com/signup/creator
2. Clicks OAuth provider (Google/GitHub)
3. OAuth provider redirects back to dashboard.kstorybridge.com/auth/callback
4. AuthCallbackPage processes authentication
5. Creates user profile (via Edge Function)
6. Redirects to /creators/home or /buyers/home
```

## 🔗 Cross-App Navigation

### Website → Dashboard Links

The website uses `VITE_DASHBOARD_URL` environment variable for all auth links:

```typescript
// Example from website Header.tsx
<Button onClick={() => 
  window.location.href = `${import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:8081'}/signup`
}>
  Sign Up
</Button>
```

### Key Navigation Patterns

| User Action | Website URL | Redirects To |
|------------|-------------|--------------|
| Sign Up (Buyer) | Any page | `dashboard/signup/buyer` |
| Sign Up (Creator) | `/creators` | `dashboard/signup/creator` |
| Sign In | Any page | `dashboard/signin` |
| View Dashboard | N/A | `dashboard/buyers/home` or `dashboard/creators/home` |

## 🔐 Authentication Implementation

### Supabase Configuration
- **Shared Database**: Both apps use same Supabase project
- **Auth State**: Managed in Dashboard app only
- **Session Storage**: localStorage in Dashboard app

### Account Types
- **Buyer**: `account_type: 'buyer'` → `/buyers/home`
- **Creator**: `account_type: 'creator'` → `/creators/home`

### Database Tables
- `user_buyers` - Buyer profiles
- `user_creators` - Creator profiles (formerly `user_ipowners`)

## 🧪 Local Testing Setup

### Environment Configuration

**Website `.env.local`:**
```bash
VITE_DASHBOARD_URL=http://localhost:8081
VITE_WEBSITE_URL=http://localhost:5173
```

**Dashboard `.env.local`:**
```bash
VITE_DASHBOARD_URL=http://localhost:8081
VITE_WEBSITE_URL=http://localhost:5173
VITE_LOCAL_TESTING=true
VITE_OAUTH_TESTING=true
VITE_AUTH_DEBUG=true

# For local Supabase (optional)
# VITE_SUPABASE_URL=http://localhost:54321
# VITE_SUPABASE_ANON_KEY=<local-anon-key>
```

### OAuth Configuration

For OAuth to work locally, add these redirect URLs in Supabase:
- `http://localhost:8081/auth/callback`
- `http://localhost:5173/auth/callback` (not used but good to have)

### Testing Flows

1. **Test Buyer Signup**:
   - Start: `http://localhost:5173` (website)
   - Click "Sign Up"
   - Redirected to: `http://localhost:8081/signup/buyer`
   - Complete signup
   - End: `http://localhost:8081/buyers/home`

2. **Test Creator Signup**:
   - Start: `http://localhost:5173/creators` (website)
   - Click "Join as Creator"
   - Redirected to: `http://localhost:8081/signup/creator`
   - Complete signup
   - End: `http://localhost:8081/creators/home`

## 🐛 Common Issues & Solutions

### Issue: "OAuth redirects to production"
**Solution**: Ensure Supabase OAuth providers have localhost URLs configured

### Issue: "Cannot find signup page"
**Solution**: Auth pages are in Dashboard app, not Website app

### Issue: "Account type undefined"
**Solution**: Check URL includes `?account_type=creator` or `?account_type=buyer`

### Issue: "Cross-domain cookie issues"
**Solution**: Both apps must be on same protocol (http or https)

## 📁 File Structure

### Dashboard App (Contains Auth)
```
apps/dashboard/src/pages/
├── SigninPage.tsx          # Sign in
├── SignupPage.tsx          # Generic signup redirect
├── BuyerSignupPage.tsx     # Buyer signup flow
├── CreatorSignupPage.tsx   # Creator signup flow
├── AuthCallbackPage.tsx    # OAuth callback handler
└── ForgotPasswordPage.tsx  # Password reset
```

### Website App (No Auth)
```
apps/website/src/
├── pages/                  # Marketing pages only
├── config/urls.ts         # Dashboard URL configuration
└── components/            # UI components (no auth)
```

## 🔧 Edge Functions

### `create-creator-profile`
- **Purpose**: Creates `user_creators` records during OAuth
- **Location**: `supabase/functions/create-creator-profile/`
- **Trigger**: Called by AuthCallbackPage for creator signups
- **Bypasses**: Database trigger permission issues

## 📝 Key Takeaways

1. **Website = Marketing, Dashboard = Auth + App**
2. **All auth pages live in Dashboard app**
3. **Website redirects to Dashboard for auth**
4. **OAuth callbacks go to Dashboard app**
5. **Both apps share same Supabase database**
6. **Account types: 'buyer' and 'creator' only**