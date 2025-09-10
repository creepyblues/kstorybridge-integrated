# OAuth Creator Flow - Issues & Solutions

## 🔍 Problem Analysis

**User Report**: 
1. ❌ OAuth creator signup redirects to production instead of localhost  
2. ❌ Creator profiles not created in `user_creators` table after OAuth signup
3. ✅ Buyer OAuth works correctly  
4. ✅ Creator email signup works correctly

## 🚨 Root Causes Identified

### 1. AuthCallbackPage Interference ✅ FIXED
**Problem**: AuthCallbackPage was trying to create creator profiles automatically using Edge Function instead of letting the normal SignupForm completion flow handle it.

**Solution**: Updated AuthCallbackPage to always redirect creators to signup completion:
```typescript
if (finalAccountType === 'creator') {
  // Always redirect to signup completion to collect full profile data
  console.log('🎨 AUTH CALLBACK: Redirecting creator to signup completion');
  const displayInfo = getAccountTypeDisplayInfo(finalAccountType);
  navigate(`${displayInfo.signupPath}?complete=true&user_id=${user.id}&email=${encodeURIComponent(user.email)}`);
}
```

### 2. Account Type Consistency ✅ VERIFIED
**Status**: All components now consistently use `'creator'` account type:
- ✅ SignupForm: `account_type: 'creator'`
- ✅ OAuth URLs: `?account_type=creator`  
- ✅ AuthCallbackPage: Validates `'creator'`
- ✅ Database triggers: Match `account_type = 'creator'`

### 3. Environment Configuration ✅ VERIFIED  
**Status**: Environment variables correctly configured:
- ✅ `apps/dashboard/.env.local`: `VITE_DASHBOARD_URL=http://localhost:8081`
- ✅ `apps/website/.env.local`: `VITE_DASHBOARD_URL=http://localhost:8081`
- ✅ Vite configs: Dashboard port 8081, Website port 5173

## 🔄 Corrected OAuth Flow

### Before Fix (Broken)
1. User clicks OAuth on website  
2. Google redirects to `/auth/callback?account_type=creator`
3. ❌ AuthCallbackPage tries Edge Function `create-creator-profile`
4. ❌ Edge Function fails or succeeds with minimal data
5. ❌ User either redirects to production or gets incomplete profile

### After Fix (Working)
1. User clicks OAuth on website (`localhost:5173`)
2. Google redirects to `/auth/callback?account_type=creator` (`localhost:8081`)
3. ✅ AuthCallbackPage sets metadata `account_type: 'creator'`
4. ✅ AuthCallbackPage redirects to `/signup/creator?complete=true&user_id=...&email=...`
5. ✅ SignupForm detects `isOAuthUser = true` from URL params
6. ✅ User fills creator form (pen_name, role, company, etc.)
7. ✅ SignupForm calls `createCreatorProfileAtomic()` → inserts into `user_creators`
8. ✅ User redirected to `/creators/home/`

## 🛠️ Technical Changes Made

### 1. AuthCallbackPage.tsx ✅
**File**: `/apps/dashboard/src/pages/AuthCallbackPage.tsx`

**Change**: Removed automatic profile creation for creators, always redirect to signup completion:
```diff
- // For creators, try to create profile automatically using Edge Function
- const response = await supabase.functions.invoke('create-creator-profile', {...});
+ // For creators, always redirect to signup completion to collect full profile data  
+ const displayInfo = getAccountTypeDisplayInfo(finalAccountType);
+ navigate(`${displayInfo.signupPath}?complete=true&user_id=${user.id}&email=${encodeURIComponent(user.email)}`);
```

### 2. Account Type Consistency ✅
**Files**: Multiple files updated to use `'creator'` instead of `'ip_owner'`
- `accountTypeDetection.ts`: Type definitions and return values
- Database triggers: Match `account_type = 'creator'`  
- Documentation: Updated manual and schema

### 3. Build Updates ✅
**Actions**: Rebuilt dashboard with changes:
```bash
cd apps/dashboard && npm run build:dev
```

## 🧪 Testing Strategy

### Manual Testing Steps
1. **Start Dev Servers**:
   ```bash
   npm run dev:website   # http://localhost:5173
   npm run dev:dashboard # http://localhost:8081
   ```

2. **Test Creator OAuth Flow**:
   - Open **fresh incognito window**  
   - Go to `http://localhost:5173`
   - Click "Sign Up" → "For Creators"
   - Click "Continue with Google"
   - Complete Google OAuth
   - **Expected**: Should redirect to `localhost:8081/signup/creator?complete=true&user_id=...`
   - Fill in creator form (pen name, role, company)
   - Click "Complete Profile"
   - **Expected**: Should create profile in `user_creators` table
   - **Expected**: Should redirect to `localhost:8081/creators/home/`

3. **Database Verification**:
   ```sql
   SELECT * FROM user_creators WHERE email = 'your-test-email@gmail.com';
   ```

### Debugging Steps
1. **Check Browser Network Tab**: Verify all redirects use `localhost` URLs
2. **Check Console Logs**: Look for AuthCallbackPage debug messages
3. **Clear Browser Data**: Ensure no cached OAuth URLs from production
4. **Verify Environment**: Run debug script to check configuration

## 🚨 If Still Not Working

### Additional Debugging Steps

#### 1. Check Supabase OAuth Configuration
The issue might be in Supabase project settings:
- Go to Supabase Dashboard → Authentication → URL Configuration
- Verify "Site URL" and "Redirect URLs" include `http://localhost:8081`
- Add `http://localhost:8081/auth/callback` to allowed redirect URLs

#### 2. Browser Issues
```bash
# Complete browser reset
1. Close all browser windows
2. Clear ALL browsing data (cache, cookies, localStorage)
3. Open fresh incognito window
4. Test OAuth flow
```

#### 3. Environment Variable Issues
```bash
# Force rebuild with explicit env vars
cd apps/website
VITE_DASHBOARD_URL=http://localhost:8081 npm run build

cd ../dashboard  
VITE_DASHBOARD_URL=http://localhost:8081 npm run build:dev
```

#### 4. OAuth URL Debug
Add console logging to track exact redirect URLs:
```javascript
// In browser console during OAuth
console.log('Current URL:', window.location.href);
localStorage.clear(); // Clear any cached data
```

## ✅ Expected Results After Fix

### 1. Localhost Redirects ✅
- All OAuth redirects should stay within `localhost:8081`
- No production URLs (`dashboard.kstorybridge.com`) should appear

### 2. Creator Profile Creation ✅  
- Profile created in `user_creators` table with all form data
- Metadata includes `account_type: 'creator'`
- User redirected to creator dashboard

### 3. Consistent Flow ✅
- Creator OAuth flow matches buyer OAuth flow pattern
- SignupForm completion handles profile creation properly
- No interference from AuthCallbackPage Edge Function

## 🎯 Success Criteria

1. ✅ OAuth creator signup stays on localhost
2. ✅ Creator profile created in `user_creators` table  
3. ✅ User metadata contains `account_type: 'creator'`
4. ✅ User redirected to `/creators/home/` after completion
5. ✅ Flow works consistently across browser sessions

The OAuth creator flow should now work identically to the buyer OAuth flow, with proper profile creation and localhost URL handling.