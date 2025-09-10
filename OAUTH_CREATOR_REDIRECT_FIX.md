# OAuth Creator Redirect Fix

## Problem
When creators sign up using OAuth (Google), they were being redirected to `/signup/buyer` instead of the creator dashboard or creator signup completion page.

## Root Cause
The issue was in the OAuth flow where the `account_type` parameter was passed in the callback URL (`/auth/callback?account_type=ip_owner`) but was not being used to set the user's metadata. This caused the account type detection logic to fall back to the default `buyer` type.

## Debug Analysis
Console logs showed:
- User metadata `account_type` was `undefined` after OAuth login
- Database queries for both `user_buyers` and `user_creators` returned 406 errors with "The result contains 0 rows"
- `RootRedirect` component defaulted to buyer and redirected to `/signup/buyer`
- The OAuth flow included `account_type` parameter in redirect URL but it wasn't being used

## Solution
Updated `AuthCallbackPage.tsx` to:
1. Extract the `account_type` parameter from the callback URL
2. Check if the user's metadata already has the correct `account_type`
3. If not, update the user metadata using `supabase.auth.updateUser()`
4. Update the local user object so the redirect logic uses the correct type

### Code Changes

**File:** `apps/dashboard/src/pages/AuthCallbackPage.tsx`

Added metadata update logic after getting the user session:

```typescript
// Check if we need to update user metadata with account_type from URL
const urlParams = new URLSearchParams(window.location.search);
const urlAccountType = urlParams.get('account_type');

if (urlAccountType && (urlAccountType === 'buyer' || urlAccountType === 'ip_owner')) {
  const currentAccountType = user.user_metadata?.account_type;
  
  if (!currentAccountType || currentAccountType !== urlAccountType) {
    console.log('🔄 AUTH CALLBACK: Setting account_type in metadata:', { 
      current: currentAccountType, 
      new: urlAccountType 
    });
    
    try {
      // Update user metadata with the account type from URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          account_type: urlAccountType
        }
      });
      
      if (updateError) {
        console.error('❌ AUTH CALLBACK: Error updating user metadata:', updateError);
      } else {
        console.log('✅ AUTH CALLBACK: Successfully updated user metadata with account_type');
        // Update the local user object so the redirect logic uses the correct type
        user.user_metadata = {
          ...user.user_metadata,
          account_type: urlAccountType
        };
      }
    } catch (metadataError) {
      console.error('❌ AUTH CALLBACK: Error updating metadata:', metadataError);
    }
  }
}
```

**Also Fixed:** `apps/dashboard/src/components/SignupForm.tsx`
- Changed type definition from `type AccountType = 'buyer' | 'creator';` to `type AccountType = 'buyer' | 'ip_owner';` for consistency

## How It Works
1. User clicks "Sign up with Google" on creator signup page
2. OAuth URL includes `?account_type=ip_owner` parameter
3. After successful Google auth, user is redirected to `/auth/callback?account_type=ip_owner`
4. **NEW:** AuthCallbackPage extracts `account_type` from URL and updates user metadata
5. Account type detection now finds `ip_owner` in metadata (high confidence)
6. User is redirected to creator dashboard or creator signup completion

## Testing
Created comprehensive test scripts that verify:
- ✅ Users without metadata + URL parameter get metadata updated
- ✅ Users with existing correct metadata are not changed
- ✅ Buyer OAuth flow works correctly
- ✅ Regular signin (no OAuth) is not affected
- ✅ Build passes with type fixes

## Test Results
Before fix:
- Creator OAuth → `/signup/buyer` ❌

After fix:
- Creator OAuth → Metadata updated → Creator signup completion or dashboard ✅
- Buyer OAuth → Buyer signup completion ✅
- Regular signin → No interference ✅

## Files Modified
1. `/apps/dashboard/src/pages/AuthCallbackPage.tsx` - Added metadata update logic
2. `/apps/dashboard/src/components/SignupForm.tsx` - Fixed type definition

## Impact
- ✅ Creator OAuth signup now works correctly
- ✅ Buyers and regular signin flows unchanged
- ✅ No breaking changes to existing functionality
- ✅ Improved logging for debugging OAuth issues

The fix ensures that the `account_type` passed in the OAuth callback URL is preserved in user metadata, allowing the account type detection system to work correctly for OAuth users.