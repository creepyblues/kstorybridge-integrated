# Creator V2 - OAuth Configuration Reference

**Last Updated**: 2025-10-29
**Purpose**: Quick reference for OAuth callback URL configuration

---

## 🔐 OAuth Callback URLs

### Development (Local)
```
http://localhost:8083/auth/callback
```

### Staging
```
https://creator-staging.kstorybridge.com/auth/callback
```

### Production
```
https://creator.kstorybridge.com/auth/callback
```

**Multi-Environment Support**: Creator V2 uses explicit domain detection to route OAuth callbacks correctly:
- Production: `creator.kstorybridge.com`
- Staging: `creator-staging.kstorybridge.com`
- Localhost: `localhost:8083`

See [Implementation Details](#-implementation-details) below for technical explanation.

---

## 🔧 Where to Update

### 1. Google OAuth Console

**Access URL**: https://console.cloud.google.com/apis/credentials

**Steps**:
1. Go to Google Cloud Console
2. Select your project (kstorybridge or equivalent)
3. Navigate to: **APIs & Services → Credentials**
4. Find your OAuth 2.0 Client ID
5. Click the pencil icon (Edit)
6. Scroll to "Authorized redirect URIs"
7. Add ALL callback URLs listed above
8. Click "Save"

**Current OAuth Client**:
- Client ID: (should already exist for kstorybridge.com)
- If creating new: Web application type

**Required URIs to Add**:
```
https://creator.kstorybridge.com/auth/callback
https://creator-staging.kstorybridge.com/auth/callback
http://localhost:8083/auth/callback
```

**Note**: All three URLs must be added for local development, staging, and production environments to work.

---

### 2. Supabase Auth Settings

**Access URL**: https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd/auth/url-configuration

**Steps**:
1. Go to Supabase Dashboard
2. Select project: **dlrnrgcoguxlkkcitlpd**
3. Navigate to: **Authentication → URL Configuration**
4. Scroll to "Redirect URLs" section
5. Add ALL callback URLs listed above (one per line)
6. Update "Site URL" to production URL
7. Click "Save"

**Redirect URLs to Add** (All Apps):
```
# Creator App
https://creator.kstorybridge.com/auth/callback
https://creator-staging.kstorybridge.com/auth/callback
http://localhost:8083/auth/callback

# Dashboard App
https://dashboard.kstorybridge.com/auth/callback
https://dashboard-v2.kstorybridge.com/auth/callback
http://localhost:8081/auth/callback
```

**Site URL**:
```
https://creator.kstorybridge.com
```

**Note**: Both creator and dashboard apps share the same Supabase project. All redirect URLs for both apps must be whitelisted.

---

## ✅ Verification Checklist

After updating OAuth settings:

### Google OAuth Console
- [ ] Authorized redirect URIs includes production URL (`creator.kstorybridge.com`)
- [ ] Authorized redirect URIs includes staging URL (`creator-staging.kstorybridge.com`)
- [ ] Authorized redirect URIs includes localhost (`localhost:8083`)
- [ ] Changes saved successfully
- [ ] No errors or warnings displayed

### Supabase Auth Settings
- [ ] Redirect URLs includes all creator URLs (production, staging, localhost)
- [ ] Redirect URLs includes all dashboard URLs (production, staging, localhost)
- [ ] Site URL set to production domain
- [ ] Changes saved successfully

### Testing
- [ ] Test OAuth signup on localhost:8083 (before deployment)
- [ ] Test OAuth signup on staging (creator-staging.kstorybridge.com)
- [ ] Test OAuth signup on production (creator.kstorybridge.com)
- [ ] Test OAuth signin (existing user) on all environments
- [ ] Verify no "redirect_uri_mismatch" errors
- [ ] Verify no 400 "code verifier" errors
- [ ] Verify no 401 Unauthorized errors

---

## 🚨 Common Issues

### "redirect_uri_mismatch" Error

**Symptom**: OAuth fails with error message
**Cause**: Callback URL not registered
**Solution**:
1. Check exact URL in browser address bar when error occurs
2. Add that exact URL to both Google Console and Supabase
3. Make sure no trailing slash differences
4. Protocol must match exactly (http vs https)

### OAuth Hangs or Times Out

**Symptom**: OAuth redirects but hangs on callback page
**Cause**: Usually a code exchange issue (should be fixed in V2)
**Solution**:
1. Check browser console for errors
2. Verify Supabase credentials correct
3. Check network tab for failed requests
4. Ensure single auth listener (V2 design)

### Different Callback URL in Dev vs Production

**Symptom**: Works locally but not in production
**Cause**: Forgot to add production URL
**Solution**:
1. Add production URL to both services
2. Wait a few minutes for changes to propagate
3. Clear browser cache and try again

---

## 📋 Quick Copy-Paste

### For Google OAuth Console (All Apps)
```
https://creator.kstorybridge.com/auth/callback
https://creator-staging.kstorybridge.com/auth/callback
https://dashboard.kstorybridge.com/auth/callback
https://dashboard-v2.kstorybridge.com/auth/callback
http://localhost:8081/auth/callback
http://localhost:8083/auth/callback
```

### For Supabase Auth Settings (All Apps)
```
https://creator.kstorybridge.com/auth/callback
https://creator-staging.kstorybridge.com/auth/callback
https://dashboard.kstorybridge.com/auth/callback
https://dashboard-v2.kstorybridge.com/auth/callback
http://localhost:8081/auth/callback
http://localhost:8083/auth/callback
```

---

## 🔧 Implementation Details

### Explicit Domain Handling Pattern

**Problem**: Both creator and dashboard apps share the same Supabase project with a single "Site URL" configuration, which can cause OAuth callbacks to redirect to the wrong domain.

**Solution**: Explicit domain detection in OAuth initiation code.

**Location**: `apps/creator/src/lib/auth.ts` (lines 150-159)

```typescript
// Detect environment and set correct redirect URL
const isStaging = window.location.hostname === 'creator-staging.kstorybridge.com'
const isProduction = window.location.hostname === 'creator.kstorybridge.com'

const redirectUrl = isStaging
  ? 'https://creator-staging.kstorybridge.com/auth/callback'
  : isProduction
  ? 'https://creator.kstorybridge.com/auth/callback'
  : `${window.location.origin}/auth/callback`  // Localhost
```

**Why This Works**:
- Bypasses Supabase Site URL configuration
- Explicitly tells Google OAuth which callback URL to use
- Handles production, staging, and localhost correctly
- Each app controls its own redirect logic

### Check-Then-Fallback Pattern

**Problem**: Supabase's `detectSessionInUrl: true` automatically exchanges OAuth codes. If we also call `exchangeCodeForSession()` explicitly, we attempt to use the same single-use code twice → 400 error.

**Solution**: Check if automatic exchange succeeded before attempting explicit exchange.

**Location**: `apps/creator/src/pages/auth/AuthCallback.tsx` (lines 18-56)

```typescript
// Check if session already exists from automatic code exchange
let { data: { session } } = await supabase.auth.getSession()

if (session) {
  console.log('✅ OAuth session found (automatic exchange)')
} else {
  // Fallback: Explicit exchange if automatic failed
  const result = await supabase.auth.exchangeCodeForSession(code)
  session = result.data.session
}
```

**Why This Works**:
- Respects automatic code exchange (when it works)
- Provides fallback for edge cases
- Prevents duplicate code exchange attempts
- Avoids 400 "code verifier" errors

---

## 🔄 Update History

| Date | Change | Updated By |
|------|--------|------------|
| 2025-10-29 | Added multi-environment support (staging URLs) | Claude |
| 2025-10-29 | Added explicit domain handling pattern documentation | Claude |
| 2025-10-29 | Added check-then-fallback pattern documentation | Claude |
| 2025-10-24 | Initial setup for V2 | Claude |

---

## 📞 Support

If OAuth issues persist:
1. Check Google OAuth Console quota limits
2. Verify Supabase project is on correct plan
3. Test with incognito/private browser window
4. Check Supabase logs for auth errors

---

**Next Steps After Configuration**:
1. Test OAuth locally (localhost:8083)
2. Deploy to staging (creator-staging.kstorybridge.com)
3. Test OAuth on staging URL
4. Merge to main and deploy to production (creator.kstorybridge.com)
5. Test OAuth on production domain
6. Verify all environments working correctly
