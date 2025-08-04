# Apply Profiles Table Migration

The profile page error occurs because the `profiles` table doesn't exist in the database. I've created a migration to fix this.

## How to Apply the Migration

### Option 1: Using Supabase CLI (Recommended)
```bash
cd apps/dashboard
npx supabase db push
```

### Option 2: Manual SQL Execution
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20250804000000-create-profiles-table.sql`
4. Execute the SQL

### Option 3: Using psql (if you have direct database access)
```bash
cd apps/dashboard
psql -h your-db-host -U your-username -d your-database -f supabase/migrations/20250804000000-create-profiles-table.sql
```

## What This Migration Does

1. **Creates the `profiles` table** with all the fields expected by the dashboard code
2. **Syncs existing user data** from `user_buyers` and `user_ipowners` tables into the new `profiles` table
3. **Sets up Row Level Security (RLS)** policies for proper access control
4. **Creates triggers** to automatically populate the profiles table for new users
5. **Fixes field naming** (changes `pen_name_or_studio` to `pen_name` to match TypeScript types)

## After Running the Migration

The profile pages should work correctly for both buyers and creators at:
- `/buyers/profile`
- `/creators/profile`

The pages will show all profile fields with edit functionality and proper data persistence.