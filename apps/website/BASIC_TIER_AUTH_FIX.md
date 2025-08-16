# Basic Tier Authentication Fix

## Problem Identified

Users with `tier="basic"` in the `user_buyers` table were being redirected to the `/invited` page instead of the dashboard after successful signin.

## Root Cause

The authentication logic in multiple files was incorrectly treating `tier="basic"` users as "not fully accepted" and sending them to the invited page instead of the dashboard.

### Incorrect Logic (Before Fix)
```typescript
// This excluded basic users from going to dashboard
if (tier && tier !== 'invited' && tier !== 'basic') {
  // Go to dashboard
} else {
  // Go to /invited page  
}
```

### Expected Behavior
- `tier: 'invited'` → `/invited` page (waiting for approval)
- `tier: 'basic'` → Dashboard (standard access)  
- `tier: 'pro'` → Dashboard (premium access)
- `tier: 'suite'` → Dashboard (full access)

## Files Fixed

### 1. SigninPage.tsx
**Before**:
```typescript
if (profile?.tier && profile.tier !== 'invited' && profile.tier !== 'basic') {
  await redirectToDashboard(); // ❌ Basic users excluded
} else {
  navigate('/invited');
}
```

**After**:
```typescript
if (profile?.tier && profile.tier !== 'invited') {
  await redirectToDashboard(); // ✅ Basic users included
} else {
  navigate('/invited');
}
```

### 2. AuthCallbackPage.tsx
**Before**:
```typescript
if (tier && tier !== 'invited' && tier !== 'basic') {
  await redirectToDashboard(); // ❌ Basic users excluded
} else {
  navigate('/invited');
}
```

**After**:
```typescript
if (tier && tier !== 'invited') {
  await redirectToDashboard(); // ✅ Basic users included
} else {
  navigate('/invited');
}
```

### 3. useAuth.ts
**Before**:
```typescript
invitation_status: (result.data.tier === 'basic' || result.data.tier === 'invited') ? 'invited' : 'accepted'
// ❌ Basic users marked as 'invited' status
```

**After**:
```typescript
invitation_status: (result.data.tier === 'invited') ? 'invited' : 'accepted'
// ✅ Only 'invited' tier users marked as 'invited' status
```

## Impact of Fix

✅ **Basic tier users can access dashboard** - No more stuck on invited page  
✅ **Consistent across signin methods** - Both OAuth and email signin work  
✅ **Proper tier hierarchy** - Only 'invited' tier users need approval  
✅ **Better user experience** - New signups can immediately access dashboard  

## Testing Scenarios

After this fix, test these scenarios:
- [ ] User with `tier: 'basic'` signs in via email → should go to dashboard
- [ ] User with `tier: 'basic'` signs in via OAuth → should go to dashboard  
- [ ] User with `tier: 'invited'` signs in → should go to `/invited` page
- [ ] User with `tier: 'pro'` signs in → should go to dashboard
- [ ] New signup creates user with `tier: 'basic'` → can sign in to dashboard

## Expected Database State

After the database migration and this fix:
- New users get `tier: 'basic'` by default
- `tier: 'basic'` users have full dashboard access
- Only `tier: 'invited'` users are restricted to invited page
- Higher tiers (`pro`, `suite`) have dashboard access

The authentication flow now correctly treats `tier: 'basic'` as an accepted user tier with dashboard access!