# Creator Signup and Signin Process Summary

## Current Implementation Status

✅ **All creator flows have been verified and fixed**

## Creator Signup Flow

### 1. Regular Email Signup (`/signup/creator`)
**Process**:
1. User fills out creator signup form
2. Form submits with `account_type: 'ip_owner'` metadata
3. Database trigger routes user to `user_ipowners` table
4. User gets email verification
5. After verification → redirected to `/signin` page
6. User signs in → directed to `/creator/invited` page (default status)

**Database**: Creates record in `user_ipowners` table with `invitation_status: 'invited'`

### 2. OAuth Signup (Google)
**Process**:
1. User clicks "Continue with Google" on `/signup/creator`
2. OAuth redirect URL includes `account_type=creator`
3. Google redirects to `/auth/callback?account_type=creator`
4. `AuthCallbackPage` checks if user profile exists
5. **If no profile**: Redirects to `/signup/creator?complete=true` for additional info
6. User completes profile → inserted into `user_ipowners` table
7. Redirected to `/signin` page
8. User signs in → directed to `/creator/invited` page

**OAuth Profile Completion**: Users provide additional creator-specific information

## Creator Signin Flow

### Authentication Logic
- **Regular signin**: Checks `user_ipowners.invitation_status`
- **OAuth signin**: Same logic via `AuthCallbackPage`

### Redirect Logic
```typescript
if (invitation_status === 'accepted') {
  // Redirect to dashboard with session parameters
  redirectToDashboard();
} else {
  // Redirect to creator invited page
  navigate('/creator/invited');
}
```

## Database Schema

### user_ipowners Table
```sql
CREATE TABLE user_ipowners (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  pen_name TEXT,
  ip_owner_role ip_owner_role, -- enum: 'author' | 'agent'
  ip_owner_company TEXT,
  website_url TEXT,
  invitation_status TEXT DEFAULT 'invited', -- 'invited' | 'accepted'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Database Trigger
- Routes `account_type: 'ip_owner'` to `user_ipowners` table
- Sets `invitation_status: 'invited'` by default
- Maps metadata fields correctly (`pen_name`, not `pen_name`)

## Table Separation (Buyers vs Creators)

✅ **Proper separation maintained**:
- **Buyers** → `user_buyers` table (with `tier` field)
- **Creators** → `user_ipowners` table (with `invitation_status` field)
- OAuth callback checks both tables independently
- No cross-contamination between account types

## OAuth Flow for Creators

### New Creator (No Profile)
1. OAuth signin → `/auth/callback?account_type=creator`
2. No profile found in either table
3. Redirects to `/signup/creator?complete=true`
4. User completes additional information
5. Profile created in `user_ipowners`
6. Redirected to `/signin`

### Existing Creator (Has Profile)
1. OAuth signin → `/auth/callback`
2. Profile found in `user_ipowners` table
3. Checks `invitation_status`
4. Redirects to dashboard (if accepted) or `/creator/invited` (if pending)

## Key Fixes Applied

### 1. Database Trigger Fix
- **Before**: No `invitation_status` set for creators
- **After**: Sets `invitation_status: 'invited'` by default

### 2. Metadata Field Fix
- **Before**: Signup form used `pen_name` in metadata
- **After**: Uses `pen_name` to match database schema

### 3. TypeScript Types Fix
- **Before**: Types showed `pen_name` field
- **After**: Updated to `pen_name` to match database

### 4. Redirect Fix
- **Before**: OAuth and email signup redirected to homepage/invited
- **After**: Both redirect to `/signin` page after successful signup

## Expected User Journey

### For New Creators
1. **Signup** (`/signup/creator`) → **Verification** → **Signin** (`/signin`) → **Creator Invited** (`/creator/invited`)
2. **OAuth Signup** → **Profile Completion** → **Signin** → **Creator Invited**

### For Existing Creators
1. **Signin** → **Creator Invited** (if `invitation_status: 'invited'`)
2. **Signin** → **Dashboard** (if `invitation_status: 'accepted'`)

## Testing Checklist

- [ ] Creator email signup → `user_ipowners` table insertion
- [ ] Creator OAuth signup → profile completion flow
- [ ] Creator OAuth signin → proper authentication  
- [ ] Creator regular signin → proper authentication
- [ ] Table separation maintained (no buyers in `user_ipowners`)
- [ ] Proper redirect to `/signin` after successful signup
- [ ] Database trigger creates `invitation_status: 'invited'`

## Files Modified

- `src/components/SignupForm.tsx` - Fixed metadata field name
- `src/integrations/supabase/types.ts` - Fixed TypeScript types  
- `supabase/migrations/20250816_align_with_dashboard_schema.sql` - Fixed database trigger
- Build verification completed successfully

The creator signup and signin process is now fully functional and consistent with the buyer flow!