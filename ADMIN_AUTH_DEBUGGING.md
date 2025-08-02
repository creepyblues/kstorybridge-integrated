# Admin Authentication Debugging Guide

## Issue Description
The admin page gets stuck on "Verifying admin access..." with a loading spinner, indicating the `useAdminAuth` hook is unable to load the admin profile for the authenticated user `sungho@dadble.com`.

## Root Cause Analysis

Based on the console log showing "Loading admin profile for authenticated user: sungho@dadble.com", the issue occurs in the `loadAdminProfile` function where the database query fails.

### Likely Causes:

1. **Missing Admin Record**: No record exists for `sungho@dadble.com` in the admin table
2. **RLS Policy Issues**: Row Level Security policies prevent the authenticated user from querying the admin table
3. **Database Migration Not Applied**: The admin table or policies haven't been properly set up

## Solutions Implemented

### 1. Enhanced Error Logging (`useAdminAuth.tsx`)
- Added detailed error messages with specific error codes
- Added 10-second timeout to prevent infinite loading
- Added actionable suggestions for each error type

### 2. Debug Components
- **AdminAuthDebug.tsx**: Comprehensive diagnostic tool
- **ProtectedRoute.tsx**: Added "Debug Authentication Issue" button
- **debug-admin-auth.js**: Browser console debug script

### 3. Database Fix Script (`fix-admin-access.sql`)
- Checks admin table status
- Fixes RLS policies
- Inserts missing admin record for `sungho@dadble.com`
- Provides verification queries

## Quick Fix Steps

### Option 1: Database Fix (Recommended)
Run the following SQL in your Supabase SQL editor:

```sql
-- Fix RLS policy
DROP POLICY IF EXISTS "Admins can view admin records" ON public.admin;
CREATE POLICY "Authenticated users can view admin records" 
  ON public.admin FOR SELECT TO authenticated USING (true);

-- Insert admin record
INSERT INTO public.admin (email, full_name, active) 
VALUES ('sungho@dadble.com', 'Sungho Lee', true)
ON CONFLICT (email) DO UPDATE SET active = true;
```

### Option 2: Use Debug Tools
1. Wait for the "Access Denied" screen to appear
2. Click "Debug Authentication Issue"
3. Follow the suggestions provided by the diagnostic tool

### Option 3: Browser Console Debug
1. Open browser console on the stuck admin page
2. Run: `await window.debugAdminAuth()` (if available)
3. Or paste and run the contents of `debug-admin-auth.js`

## Testing the Fix

After applying the database fix:

1. **Clear browser cache/cookies**
2. **Log out and log back in** to the admin portal
3. **Check browser console** for success messages:
   - "✅ Admin profile loaded successfully"
   - No error messages about missing records or permissions

## Common Error Codes and Solutions

### PGRST116 - No rows returned
- **Problem**: No admin record found for the email
- **Solution**: Insert admin record in database

### 42501 - Permission denied
- **Problem**: RLS policy too restrictive
- **Solution**: Update RLS policy to allow authenticated users

### Connection errors
- **Problem**: Supabase connection or configuration
- **Solution**: Check Supabase URL, anon key, and network

## Verification Queries

Run these in Supabase SQL editor to verify the fix:

```sql
-- Check admin table structure
SELECT * FROM public.admin;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'admin';

-- Test the exact query the app runs
SELECT * FROM public.admin 
WHERE email = 'sungho@dadble.com' AND active = true;
```

## Files Modified for Debugging

1. `apps/admin/src/hooks/useAdminAuth.tsx` - Enhanced error handling
2. `apps/admin/src/components/ProtectedRoute.tsx` - Added debug mode
3. `apps/admin/src/components/AdminAuthDebug.tsx` - New diagnostic component
4. `fix-admin-access.sql` - Database fix script
5. `debug-admin-auth.js` - Browser console debug script

## Prevention

To prevent this issue in production:

1. **Ensure migrations are applied** before deployment
2. **Pre-populate admin records** for authorized users
3. **Test authentication flow** in staging environment
4. **Monitor logs** for authentication errors
5. **Document admin user management** procedures

## Support Commands

```bash
# Build and test admin app
npm run build:admin

# Start admin development server
npm run dev:admin

# Check for admin-related files
find apps/admin -name "*admin*" -type f

# Search for authentication code
grep -r "loadAdminProfile" apps/admin/src/
```

The enhanced error logging and debug tools should now provide clear guidance on what's preventing the authentication from completing.