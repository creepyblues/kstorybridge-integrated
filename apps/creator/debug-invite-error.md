# Debug Guide: Supabase Invite User Error

## Error Message
```
Failed to invite user: Failed to make POST request to 
"https://dlrnrgcoguxlkkcitlpd.supabase.co/auth/v1/invite"
Error: duplicate key value violates unique constraint "users_email_partial_key"
```

## What This Error Means

The error `users_email_partial_key` is a database constraint violation in Supabase Auth. This occurs when:

1. **User Already Exists**: The email you're trying to invite already exists in the auth.users table
2. **Partial Registration**: A user started signup but didn't complete email verification
3. **Deleted User Issue**: User was deleted but email constraint remains

## Debugging Steps

### 1. Check Existing Users in Supabase Dashboard

Go to your Supabase Dashboard:
1. Navigate to **Authentication** → **Users**
2. Search for the email you're trying to invite
3. Check if user exists with status:
   - `Waiting for verification` - User signed up but didn't verify
   - `Confirmed` - User already verified
   - Check `created_at` timestamp

### 2. Clean Up Partial/Unverified Users

If user exists but is unverified:

**Option A: Delete via Dashboard**
- Click on the user in Authentication → Users
- Click "Delete user" button
- Try inviting again

**Option B: Use SQL Editor** (Supabase Dashboard → SQL Editor)
```sql
-- Check for existing user
SELECT id, email, confirmed_at, created_at, last_sign_in_at
FROM auth.users
WHERE email = 'user@example.com';

-- Delete unconfirmed user (BE CAREFUL!)
DELETE FROM auth.users
WHERE email = 'user@example.com'
AND confirmed_at IS NULL;
```

### 3. Check for User Profile Tables

Sometimes user data exists in profile tables even after auth user is deleted:

```sql
-- Check user_buyers table
SELECT * FROM public.user_buyers 
WHERE email = 'user@example.com';

-- Check user_ipowners table  
SELECT * FROM public.user_ipowners
WHERE email = 'user@example.com';

-- Clean up if needed (and auth.users is already cleaned)
DELETE FROM public.user_buyers WHERE email = 'user@example.com';
DELETE FROM public.user_ipowners WHERE email = 'user@example.com';
```

### 4. Alternative: Resend Verification Instead of Invite

If user already exists but needs verification, don't use invite. Instead:

```javascript
// Instead of inviteUserByEmail, use resend confirmation
const { error } = await supabase.auth.resend({
  type: 'signup',
  email: 'user@example.com',
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`
  }
});
```

### 5. Check Invite Method Implementation

The error suggests you're using the Admin API to invite. Make sure:

1. **Service Role Key**: Admin invites require service role key (not anon key)
2. **Correct Endpoint**: `/auth/v1/invite` requires admin privileges
3. **User Management**: Check if "Enable user invites" is ON in Auth settings

### 6. Workaround: Manual Signup Flow

Instead of using invites, implement a manual signup:

```javascript
// Create user with auto-confirm (if you have admin rights)
const { data, error } = await supabase.auth.admin.createUser({
  email: 'user@example.com',
  email_confirm: true, // Auto-confirm email
  user_metadata: { 
    invited: true,
    invited_at: new Date().toISOString() 
  }
});

// Then send a password reset email so they can set password
await supabase.auth.resetPasswordForEmail('user@example.com');
```

## Quick Fix Steps

1. **Check if user exists**: 
   - Go to Supabase Dashboard → Authentication → Users
   - Search for the email

2. **If user exists but unverified**:
   - Delete the user
   - Try invite again

3. **If user doesn't show in dashboard**:
   - Run SQL query to check auth.users table directly
   - Clean up any orphaned records

4. **If problem persists**:
   - The email might be in a "soft deleted" state
   - Contact Supabase support or wait 24 hours (soft delete cleanup)

## Prevention

To prevent this in the future:

1. **Always check if user exists before inviting**:
```javascript
const { data: existingUser } = await supabase
  .from('user_buyers')
  .select('email')
  .eq('email', email)
  .single();

if (existingUser) {
  // User exists, resend verification or handle accordingly
} else {
  // Safe to invite
}
```

2. **Handle signup errors properly**:
   - Catch "user already exists" errors
   - Provide option to resend verification
   - Guide users to password reset if needed

3. **Regular cleanup**:
   - Periodically clean unverified users older than X days
   - Monitor failed signup attempts

## Testing

Use the test file to check email functionality:
```bash
open apps/dashboard/test-email-config.html
```

This will help verify if the email system is working properly after resolving the constraint issue.