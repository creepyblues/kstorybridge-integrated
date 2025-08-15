# Google OAuth Testing Checklist

## 🧪 Local Testing (localhost)

### Start the Applications
```bash
# Terminal 1 - Website
cd apps/website
npm run dev
# Opens at http://localhost:5173

# Terminal 2 - Dashboard
cd apps/dashboard  
npm run dev
# Opens at http://localhost:8081
```

### Test Sign-Up Flow (Buyer)
1. Open http://localhost:5173/signup/buyer
2. Click "Continue with Google"
3. Select/enter Google account
4. Should redirect back to website
5. Check Supabase Dashboard:
   - Go to Authentication → Users
   - New user should appear with Google provider
   - Check user_buyers table for profile

### Test Sign-Up Flow (Creator)
1. Open http://localhost:5173/signup/creator
2. Click "Continue with Google"
3. Complete Google auth
4. Check user_ipowners table in Supabase

### Test Sign-In Flow
1. Open http://localhost:5173/signin
2. Click "Continue with Google"
3. Should redirect to dashboard after auth
4. Verify session exists

### Debugging Commands
```bash
# Check browser console for errors
# Press F12 → Console tab

# Monitor network requests
# Press F12 → Network tab → Filter by "supabase"
```

## 🚀 Production Testing

### Pre-Deployment Checklist
- [ ] Google OAuth credentials include production domains
- [ ] Supabase Site URL includes production domains
- [ ] Build passes without errors: `npm run build`
- [ ] Environment variables are set in production

### Test Production Flow
1. Deploy to production
2. Test buyer signup: https://kstorybridge.com/signup/buyer
3. Test creator signup: https://kstorybridge.com/signup/creator
4. Test signin: https://kstorybridge.com/signin
5. Verify redirect to dashboard.kstorybridge.com

## 🔍 Common Issues & Solutions

### Issue: "Redirect URI mismatch"
**Solution:** Ensure Google Console has exact URL:
```
https://dlrnrgcoguxlkkcitlpd.supabase.co/auth/v1/callback
```

### Issue: "User profile not created"
**Check:**
1. Database triggers exist in Supabase
2. Check Supabase logs for trigger errors
3. Verify metadata is being passed

### Issue: "Google button not working"
**Check:**
1. Browser console for JavaScript errors
2. Network tab for failed requests
3. Supabase provider is enabled

### Issue: "Wrong redirect after auth"
**Check:**
1. `getDashboardUrl()` function in config/urls.ts
2. Environment variables are set correctly

## 📊 Verification Queries

Run these in Supabase SQL Editor:

```sql
-- Check recent Google OAuth users
SELECT id, email, raw_app_meta_data, created_at 
FROM auth.users 
WHERE raw_app_meta_data->>'provider' = 'google'
ORDER BY created_at DESC
LIMIT 5;

-- Check buyer profiles
SELECT * FROM user_buyers 
ORDER BY created_at DESC 
LIMIT 5;

-- Check creator profiles  
SELECT * FROM user_ipowners
ORDER BY created_at DESC
LIMIT 5;
```

## ✅ Success Criteria

- [ ] Google OAuth button appears on signin/signup pages
- [ ] Clicking button opens Google auth popup
- [ ] After auth, user is created in Supabase
- [ ] User profile is created in appropriate table
- [ ] User redirects to correct page based on account type
- [ ] Can sign in again with same Google account
- [ ] Works on both localhost and production

## 📝 Notes

- First-time users will see Google consent screen
- Returning users may auto-authenticate
- Check spam folder if email verification needed
- Google OAuth bypass email verification