# Database Schema Fix Summary

## Problem Identified

The OAuth signup was failing with a 400 error:
```
"Could not find the 'plan' column of 'user_buyers' in the schema cache"
```

## Root Cause

The Website app and Dashboard app had diverged in their database schema expectations:

### Dashboard App (Correct Schema)
- Uses `tier` column in `user_buyers` table
- Enum: `user_tier` with values: "invited", "basic", "pro", "suite"

### Website App (Incorrect Schema)
- Was trying to use `plan` column in `user_buyers` table  
- Enum: `buyer_plan` with values: "basic", "pro", "a-la-carte", "suite"

## Fix Applied

### 1. Updated Website App Code
- **SignupForm.tsx**: Changed `plan: 'basic'` to `tier: 'basic'` for both OAuth and regular signups
- **useAuth.ts**: Updated queries to select `tier` instead of `plan` 
- **SigninPage.tsx**: Updated profile queries to use `tier` field
- **types.ts**: Updated TypeScript types to use `user_tier` enum instead of `buyer_plan`

### 2. Database Migration
Created migration `20250816_align_with_dashboard_schema.sql` that:
- Ensures `user_tier` enum exists with correct values
- Adds `tier` column to `user_buyers` table if missing
- Migrates any existing `plan` data to `tier` column
- Removes old `plan` column and `buyer_plan` enum
- Updates database trigger function to use `tier` field

### 3. Authentication Logic Updates
- Users with `tier: 'basic'` or `tier: 'invited'` → directed to invited page
- Users with `tier: 'pro'` or `tier: 'suite'` → directed to dashboard

### 4. Signup Flow Updates
- After successful OAuth profile completion → redirect to `/signin` page
- After successful email signup → redirect to `/signin` page (instead of homepage)

## Database Migration Required

**IMPORTANT**: You must apply the migration to fix the OAuth signup error:

### Option 1: Via Supabase Dashboard
1. Go to your Supabase project → SQL Editor
2. Copy and paste the content from `supabase/migrations/20250816_align_with_dashboard_schema.sql`
3. Execute the SQL

### Option 2: Via Supabase CLI  
```bash
cd apps/website
supabase db push
```

## Expected Results After Migration

✅ **OAuth signup works** - No more 400 errors  
✅ **New users get `tier: 'basic'`** by default  
✅ **Dashboard and Website apps use same schema**  
✅ **Existing users' data preserved**  
✅ **TypeScript compilation succeeds**  

## Testing Checklist

After applying the migration, test:
- [ ] OAuth signup flow (Google sign up → profile completion)
- [ ] Regular email/password signup  
- [ ] User authentication and redirection logic
- [ ] Dashboard app still works correctly
- [ ] No TypeScript compilation errors

## Files Modified

- `src/components/SignupForm.tsx`
- `src/hooks/useAuth.ts` 
- `src/pages/SigninPage.tsx`
- `src/integrations/supabase/types.ts`
- `supabase/migrations/20250816_align_with_dashboard_schema.sql`

## Cleanup Done

- Removed old migration file: `20250816_create_buyer_plan_basic.sql`
- Removed urgent fix documentation files
- Updated all references from `plan` to `tier`

The OAuth signup should now work correctly once the database migration is applied!