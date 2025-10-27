# Creator V2 - OAuth Configuration Reference

**Last Updated**: 2025-10-24
**Purpose**: Quick reference for OAuth callback URL configuration

---

## 🔐 OAuth Callback URLs

### Development (Local)
```
http://localhost:8083/auth/callback
http://localhost:8084/auth/callback
```

### Staging (Vercel Preview)
```
https://creator-v2-*.vercel.app/auth/callback
https://creator-v2-staging-*.vercel.app/auth/callback
```

### Production
```
https://creator.kstorybridge.com/auth/callback
```

**Note**: The `*` wildcard in Vercel URLs allows all preview deployments to work without individual configuration.

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
https://creator-v2-*.vercel.app/auth/callback
```

**Optional (for local testing)**:
```
http://localhost:8083/auth/callback
http://localhost:8084/auth/callback
```

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

**Redirect URLs to Add**:
```
https://creator.kstorybridge.com/auth/callback
https://creator-v2-*.vercel.app/auth/callback
http://localhost:8083/auth/callback
http://localhost:8084/auth/callback
```

**Site URL**:
```
https://creator.kstorybridge.com
```

**Additional Redirect URLs** (keep existing):
```
https://dashboard.kstorybridge.com/auth/callback
https://kstorybridge.com/auth/callback
http://localhost:8081/auth/callback
```

---

## ✅ Verification Checklist

After updating OAuth settings:

### Google OAuth Console
- [ ] Authorized redirect URIs list includes production URL
- [ ] Authorized redirect URIs includes Vercel wildcard
- [ ] Changes saved successfully
- [ ] No errors or warnings displayed

### Supabase Auth Settings
- [ ] Redirect URLs includes production URL
- [ ] Redirect URLs includes Vercel wildcard
- [ ] Redirect URLs includes localhost (for dev)
- [ ] Site URL set to production domain
- [ ] Changes saved successfully

### Testing
- [ ] Test OAuth signup on localhost (before deployment)
- [ ] Test OAuth signup on Vercel preview (after deploy)
- [ ] Test OAuth signup on production (after DNS setup)
- [ ] Test OAuth signin (existing user)
- [ ] Verify no "redirect_uri_mismatch" errors

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

### For Google OAuth Console
```
https://creator.kstorybridge.com/auth/callback
https://creator-v2-*.vercel.app/auth/callback
http://localhost:8083/auth/callback
```

### For Supabase Auth Settings
```
https://creator.kstorybridge.com/auth/callback
https://creator-v2-*.vercel.app/auth/callback
http://localhost:8083/auth/callback
http://localhost:8084/auth/callback
```

---

## 🔄 Update History

| Date | Change | Updated By |
|------|--------|------------|
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
1. Test OAuth locally before deploying
2. Deploy to Vercel staging
3. Test OAuth on staging URL
4. Deploy to production
5. Test OAuth on production domain
