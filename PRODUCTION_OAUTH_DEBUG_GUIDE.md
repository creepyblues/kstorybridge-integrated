# Production OAuth Creator Debug Guide

## 🚨 Current Issue
User gets stuck at `https://dashboard.kstorybridge.com/auth/callback?account_type=creator#` and creator profile is not created in `user_creators` table.

## 🔍 Extensive Debug Logging Added

I've added comprehensive debug logging to trace every step of the OAuth flow. Here's what to look for in the browser console:

### 1. Initial Callback Processing
```
🔄 AUTH CALLBACK: Processing OAuth callback
🌐 Current URL: [full URL]
🔍 URL Search: [query parameters] 
🔍 URL Hash: [hash fragment]
🔍 Hostname: [hostname]
🔍 Origin: [origin]
```

### 2. Session Retrieval
```
📡 Getting session from Supabase...
📋 AUTH CALLBACK: Session data received: {hasSession: true/false, hasUser: true/false, sessionId: 'present'/'missing'}
```

**If session fails:**
```
❌ AUTH CALLBACK: Error getting session: [error details]
❌ AUTH CALLBACK: Error details: {message, status, statusText}
```

### 3. User Information
```
✅ AUTH CALLBACK: Session found for user: [email]
👤 AUTH CALLBACK: User details: {id, email, emailConfirmed, provider, providers}
🗂️ AUTH CALLBACK: User metadata: [complete metadata object]
```

### 4. URL Parameter Processing
```
🔍 AUTH CALLBACK: URL params analysis: {
  fullSearch: "?account_type=creator", 
  accountTypeParam: "creator",
  allParams: {account_type: "creator"}
}
```

### 5. Metadata Update Process
```
🔄 AUTH CALLBACK: Account type comparison: {
  urlAccountType: "creator",
  currentAccountType: undefined/existing,
  needsUpdate: true/false
}
📡 AUTH CALLBACK: Calling supabase.auth.updateUser...
✅ AUTH CALLBACK: Successfully updated user metadata with account_type
🗂️ AUTH CALLBACK: Updated local user metadata: [updated metadata]
```

### 6. Account Type Detection
```
🚦 AUTH CALLBACK: Starting user redirect logic
🔍 AUTH CALLBACK: Starting account type detection with params: {hasUrlParams: true, urlParamsSize: 23}
📡 AUTH CALLBACK: Calling determineAccountType...
🔍 AUTH CALLBACK: Account type detection result: {
  accountType: "creator",
  profileExists: false,
  source: "metadata",
  confidence: "high"
}
```

### 7. Redirect Decision
For creators with no existing profile:
```
📝 AUTH CALLBACK: No profile found, checking account type
📝 AUTH CALLBACK: Final account type determined: creator
🎨 AUTH CALLBACK: Creator flow - preparing signup completion redirect
🎨 AUTH CALLBACK: Creator display info: {signupPath: "/signup/creator", ...}
🎨 AUTH CALLBACK: Creator redirect URL: /signup/creator?complete=true&user_id=...&email=...
```

### 8. Error Handling
If any errors occur:
```
❌ AUTH CALLBACK: Error during redirect: [error]
❌ AUTH CALLBACK: Redirect error details: {message, stack}
🔄 AUTH CALLBACK: Fallback redirect to signin
```

## 🧪 Production Testing Instructions

### Step 1: Open Browser Dev Tools
1. Go to `https://dashboard.kstorybridge.com` 
2. Open Dev Tools (F12)
3. Go to **Console** tab
4. Clear console log

### Step 2: Start OAuth Flow
1. Go to `https://kstorybridge.com`
2. Click "Sign Up" → "For Creators" 
3. Click "Continue with Google"
4. Complete Google OAuth

### Step 3: Monitor Console Output
Watch for the debug messages above. **Copy ALL console messages** and share them.

### Step 4: Check Network Tab
1. Go to **Network** tab in Dev Tools
2. Look for any failed requests (red entries)
3. Check if there are redirects to unexpected URLs

## 🔍 What to Look For

### Potential Issues:

#### 1. Session Retrieval Failure
**Symptoms:** Stuck at callback URL, no redirect
**Debug Signs:**
```
❌ AUTH CALLBACK: Error getting session: [error]
```
**Likely Causes:**
- Supabase OAuth configuration issues
- Invalid access tokens
- CORS issues

#### 2. Metadata Update Failure  
**Symptoms:** Profile not created, wrong account type
**Debug Signs:**
```
❌ AUTH CALLBACK: Error updating user metadata: [error]
```
**Likely Causes:**
- Supabase permissions issues
- Invalid metadata format

#### 3. Account Type Detection Issues
**Symptoms:** Redirected to buyer signup instead of creator
**Debug Signs:**
```
🔍 AUTH CALLBACK: Account type detection result: {accountType: "buyer", ...}
```
**Likely Causes:**
- URL parameters not parsed correctly
- Metadata not set properly

#### 4. Navigation Failure
**Symptoms:** Stays on callback URL forever
**Debug Signs:**
```
❌ AUTH CALLBACK: Error during redirect: [error]
```
**Likely Causes:**
- React Router issues
- JavaScript exceptions

#### 5. Profile Creation Failure (Later Step)
**Symptoms:** Redirects correctly but no database entry
**Debug Signs:** Look for SignupForm logs after redirect
**Likely Causes:**
- Database triggers not working
- Atomic profile creator issues

## 🚨 Emergency Debugging Steps

### If Console Shows Nothing:
1. **JavaScript might be crashing** - check for uncaught exceptions
2. **React might not be loading** - verify the dashboard app loads properly
3. **CORS issues** - check Network tab for blocked requests

### If Stuck at Callback URL:
1. **Check for infinite loops** - does the page keep refreshing?
2. **Check for navigation blocking** - are there popup blockers?
3. **Check for route protection** - is there a redirect loop?

### If Session Issues:
1. **Check Supabase status** - is the service up?
2. **Check OAuth configuration** - are redirect URLs correct?
3. **Check browser storage** - clear cookies/localStorage

## 📋 Data to Collect

Please collect and share:

1. **Complete console log output** (copy all messages)
2. **Network tab requests** (screenshot of any failed requests)
3. **Current URL when stuck** (exact URL with all parameters)
4. **User email being used for testing**
5. **Browser and version**
6. **Any error messages or popups**

## 🛠️ Quick Fixes to Try

### 1. Clear Browser Data
- Clear all cookies for `kstorybridge.com` and `dashboard.kstorybridge.com`
- Clear localStorage
- Clear sessionStorage
- Try in incognito mode

### 2. Check Supabase Configuration
- Verify OAuth redirect URLs include production URLs
- Check if site URL is set correctly
- Verify project is active

### 3. Database Check
After getting logs, check database:
```sql
-- Check if user exists in auth.users
SELECT id, email, created_at, raw_user_meta_data->>'account_type' as account_type 
FROM auth.users 
WHERE email = 'your-test-email@gmail.com';

-- Check if profile was attempted to be created
SELECT * FROM user_creators WHERE email = 'your-test-email@gmail.com';
```

## 🎯 Next Steps

1. **Test in production** with dev tools open
2. **Collect all console logs** 
3. **Share complete debugging output**
4. **Check database state** after test
5. **Identify exact failure point** from logs

The extensive debugging will help us pinpoint exactly where the flow is breaking in production.