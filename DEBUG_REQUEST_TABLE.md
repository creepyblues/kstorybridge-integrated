# Debugging Request Table Issues

## Problem
The "request" table is not being updated after a request is made through the PremiumFeaturePopup.

## Debugging Steps

### 1. Check Browser Console
When you click the "REQUEST" button, check the browser console for these debug messages:

```
=== DEBUG: Starting handleRequest ===
=== Testing Request Table ===
=== DEBUG: Attempting to save to request table ===
```

### 2. Common Error Codes and Solutions

**Error Code `42P01` - Table does not exist:**
- The migration hasn't been applied to your database
- Solution: Apply the migration in `apps/dashboard/supabase/migrations/20250801000000-create-request-table.sql`

**Error Code `23505` - Unique constraint violation:**
- User has already made this type of request for this title
- This is expected behavior - each user can only make one request of each type per title

**Error Code `42501` - Permission denied:**
- Row Level Security policies are blocking the insert
- Check if the user is properly authenticated

### 3. Manual Database Check

Connect to your Supabase database and run:

```sql
-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'request'
);

-- Check table structure
\d public.request

-- Check existing requests
SELECT * FROM public.request;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'request';
```

### 4. Test the Request Table

Open browser console on the dashboard and run:

```javascript
// Test if table is accessible
await window.testRequestTable();

// Test insert (replace with real IDs)
await window.testRequestInsert('user-id', 'title-id', 'pitch');
```

### 5. Apply Migration

If the table doesn't exist, apply the migration:

```bash
cd apps/dashboard
npx supabase db push
```

Or manually create the table using the SQL from:
`apps/dashboard/supabase/migrations/20250801000000-create-request-table.sql`

## Expected Behavior

When working correctly, you should see:
1. Console logs showing successful table access
2. Console logs showing successful request insertion
3. New row in the `request` table
4. Email notification sent to admins (for pitch requests)

## Fallback Behavior

If the request table fails, the system falls back to updating the `user_buyers` table for backwards compatibility.