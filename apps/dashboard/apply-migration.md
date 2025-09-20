# Profiles Table Setup Guide - 2025-01-14

## Status: COMPLETED - FOR REFERENCE ONLY
## Last Updated: 2025-01-14
## Safe to Follow: NO - MIGRATION ALREADY APPLIED

⚠️ **WARNING**: This migration has been completed. Do not run these commands again as they may cause database conflicts.

The profile page error occurred because the `profiles` table didn't exist in the database. This migration was created to fix this issue and has been successfully applied.

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

1. **Updates account type architecture** to use separate `user_buyers` and `user_creators` tables
2. **Maintains existing user data** from `user_buyers` and `user_creators` tables with proper account type separation
3. **Sets up Row Level Security (RLS)** policies for proper access control on account-specific tables
4. **Creates triggers** to automatically populate the appropriate profile table based on account type for new users
5. **Uses consistent field naming** (`pen_name` field in `user_creators` table to match database schema and TypeScript types)

## After Running the Migration

The profile pages should work correctly for both buyers and creators at:
- `/buyers/profile`
- `/creators/profile`

The pages will show all profile fields with edit functionality and proper data persistence.