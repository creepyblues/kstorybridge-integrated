# OAuth Authentication Fix

## Problem Identified

When users signed in through OAuth, they weren't getting proper authentication and access to the dashboard. The OAuth flow was bypassing the proper authentication logic.

## Root Cause

The `AuthCallbackPage.tsx` was handling OAuth authentication differently from regular email/password signin:

### Regular Signin Flow (Working)
1. User enters email/password
2. Supabase authenticates user  
3. Calls `checkInvitationStatusAndRedirect(user)`
4. Checks user's tier/invitation status
5. Redirects to dashboard with session parameters OR invited page

### OAuth Signin Flow (Broken)
1. User clicks OAuth signin → redirected to Google
2. Google redirects back to `/auth/callback`
3. `AuthCallbackPage` checks if profile exists
4. **BUG**: Directly redirected to dashboard with `window.location.href = dashboardUrl`
5. **MISSING**: No tier checking, no session parameter transfer

## Fix Applied

Updated `AuthCallbackPage.tsx` to follow the same authentication logic as regular signin:

### New OAuth Flow (Fixed)
1. User clicks OAuth signin → redirected to Google
2. Google redirects back to `/auth/callback`  
3. `AuthCallbackPage` checks if profile exists
4. **NEW**: Calls `checkTierAndRedirect()` function
5. **NEW**: Checks user's tier (buyer) or invitation_status (creator)
6. **NEW**: Properly redirects with session parameters

### Key Changes Made

#### 1. Added Proper Redirect Function
```typescript
const redirectToDashboard = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const dashboardUrl = getDashboardUrl();
    const sessionParams = new URLSearchParams({
      access_token: session.access_token,
      refresh_token: session.refresh_token || '',
      expires_at: session.expires_at?.toString() || '',
      token_type: session.token_type || 'bearer'
    });
    const finalUrl = `${dashboardUrl}?${sessionParams.toString()}`;
    window.location.href = finalUrl;
  }
};
```

#### 2. Added Tier Checking Logic
```typescript
const checkTierAndRedirect = async (user, buyerProfile, ipOwnerProfile) => {
  if (buyerProfile) {
    // Check tier: 'basic'/'invited' → /invited, 'pro'/'suite' → dashboard
    const tier = buyerProfile.tier;
    if (tier && tier !== 'invited' && tier !== 'basic') {
      await redirectToDashboard();
    } else {
      navigate('/invited');
    }
  } else if (ipOwnerProfile) {
    // Check invitation_status: 'accepted' → dashboard, else → /creator/invited
    if (ipOwnerProfile.invitation_status === 'accepted') {
      await redirectToDashboard();
    } else {
      navigate('/creator/invited');
    }
  }
};
```

#### 3. Updated Main OAuth Logic
```typescript
// Before (broken)
if (buyerProfile.data || ipOwnerProfile.data) {
  const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:8081';
  window.location.href = dashboardUrl; // ❌ No session transfer, no tier checking
}

// After (fixed)  
if (buyerProfile.data || ipOwnerProfile.data) {
  await checkTierAndRedirect(user, buyerProfile.data, ipOwnerProfile.data); // ✅ Proper flow
}
```

## Expected Results

✅ **OAuth signin works properly** - Users get authenticated correctly  
✅ **Session transfer** - Authentication tokens passed to dashboard  
✅ **Tier checking** - Users with 'basic' tier go to invited page  
✅ **Consistency** - OAuth and email signin follow same logic  
✅ **Debugging** - Added detailed console logging for troubleshooting  

## Testing Scenarios

After this fix, test these OAuth scenarios:
- [ ] New user OAuth signup → profile completion → signin via OAuth
- [ ] Existing user (basic tier) signin via OAuth → should go to /invited
- [ ] Existing user (pro tier) signin via OAuth → should go to dashboard  
- [ ] Creator signin via OAuth with accepted status → should go to dashboard
- [ ] Mixed flow: email signup → OAuth signin (should work)

## Files Modified

- `src/pages/AuthCallbackPage.tsx` - Added proper authentication flow for OAuth
- Build verification completed successfully

The OAuth authentication should now work consistently with the regular signin flow!