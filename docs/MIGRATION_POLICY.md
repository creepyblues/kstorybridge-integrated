# Database Migration Policy
**Created**: 2025-10-25
**Status**: Active ✅

## TL;DR

- **✅ DO**: Create all migrations in `/supabase/migrations/` (root only)
- **❌ DON'T**: Create migrations in `apps/*/supabase/migrations/` (deprecated)
- **Why**: All apps share the same Supabase database

## Background

### Problem
We previously had migrations scattered across multiple app folders:
- `/apps/dashboard/supabase/migrations/` (70 files)
- `/apps/creator/supabase/migrations/` (65 files)
- `/apps/creator/supabase/migrations/` (1 file)
- `/apps/website/supabase/migrations/` (21 files)
- `/supabase/migrations/` (18 files)

This created confusion about:
- Which migrations were actually applied to production
- Where to create new migrations
- How to track migration history

### Solution (2025-10-25)
Consolidated to single source of truth: `/supabase/migrations/` (root level only)

## Migration Workflow

### Creating New Migrations

**Always run from root directory:**

```bash
# Navigate to root
cd /Users/sungholee/code/kstorybridge

# Create new migration
npx supabase migration new [descriptive_name]

# Example
npx supabase migration new add_user_preferences_table
```

This creates: `/supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql`

### Checking Migration Status

```bash
# From root directory
cd /Users/sungholee/code/kstorybridge

# List all migrations and their status
npx supabase migration list

# Shows:
# - Local: Migrations in /supabase/migrations/
# - Remote: Migrations applied to production
# - Status: Applied or pending
```

### Applying Migrations Locally

```bash
# Reset local database (applies all migrations)
npx supabase db reset

# Or push specific migrations
npx supabase db push
```

### Applying Migrations to Production

```bash
# From root directory
cd /Users/sungholee/code/kstorybridge

# Push all pending migrations to production
npx supabase db push
```

**⚠️ Warning**: Always test migrations locally with `db reset` before pushing to production.

## Why Root Only?

### Single Shared Database
All apps connect to the same Supabase project:
- **Project ID**: `dlrnrgcoguxlkkcitlpd`
- **Database**: Shared tables (`titles`, `user_buyers`, `user_creators`, etc.)

### Problems with App-Specific Migrations
1. **Duplicate migrations**: Same schema change in multiple folders
2. **Conflicting changes**: Apps could modify same table differently
3. **Unclear history**: Hard to know what's actually applied
4. **Merge conflicts**: Multiple apps creating migrations with same timestamp

### Benefits of Root-Only Migrations
1. **✅ Single source of truth**: One folder shows complete schema history
2. **✅ No duplicates**: Each migration exists once
3. **✅ Clear history**: `migration list` shows definitive state
4. **✅ No conflicts**: Sequential, ordered schema changes
5. **✅ Easier rollbacks**: Linear migration history

## App-Specific Folders Status

### Deprecated (Historical Reference Only)
- `/apps/dashboard/supabase/migrations/` - ❌ Do not add new files
- `/apps/creator/supabase/migrations/` - ❌ Do not add new files
- `/apps/creator/supabase/migrations/` - ❌ Do not add new files
- `/apps/website/supabase/migrations/` - ❌ Do not add new files

These folders contain historical migrations but are **no longer used**. They remain for:
- Historical reference
- Understanding past schema changes
- Debugging legacy issues

**Do NOT create new migrations in these folders.**

### Edge Functions (Still App-Specific)
Edge functions remain in app-specific folders:
- ✅ `/apps/dashboard/supabase/functions/` - Dashboard edge functions
- ✅ `/supabase/functions/` - Shared edge functions

**Why?** Edge functions are app-specific logic, not shared schema.

## Migration Naming Convention

### Format
```
YYYYMMDDHHMMSS_descriptive_name.sql
```

### Examples
- ✅ `20251025120000_add_user_preferences_table.sql`
- ✅ `20251025120001_add_email_verification_column.sql`
- ✅ `20251025120002_create_notifications_rls_policies.sql`

### Best Practices
- **Descriptive names**: Clearly describe what the migration does
- **Action verbs**: Use `add`, `create`, `update`, `drop`, `fix`
- **Specific**: Include table/column names
- **No abbreviations**: Write full words for clarity

### Bad Examples
- ❌ `migration.sql` - Not descriptive
- ❌ `update_db.sql` - Too vague
- ❌ `fix.sql` - Doesn't say what's fixed
- ❌ `20251025_migration.sql` - Missing time component

## Common Migration Tasks

### Adding a New Table

```sql
-- File: /supabase/migrations/20251025120000_create_notifications_table.sql

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
```

### Adding a Column

```sql
-- File: /supabase/migrations/20251025120001_add_verified_column_to_users.sql

ALTER TABLE public.user_buyers
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.user_creators
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN public.user_buyers.email_verified
  IS 'Whether user has verified their email address';
```

### Updating RLS Policies

```sql
-- File: /supabase/migrations/20251025120002_fix_creator_insert_policy.sql

-- Drop old policy
DROP POLICY IF EXISTS "Creators can insert own profile" ON public.user_creators;

-- Create new policy
CREATE POLICY "Creators can insert own profile"
  ON public.user_creators
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

## Troubleshooting

### Error: "Migration already exists"
**Problem**: Duplicate timestamp (two migrations created in same second)

**Solution**: Rename one migration file with incremented timestamp:
```bash
# Original
20251025120000_add_feature_a.sql
20251025120000_add_feature_b.sql

# Fix
20251025120000_add_feature_a.sql
20251025120001_add_feature_b.sql  # Incremented by 1 second
```

### Error: "Migration not found"
**Problem**: Migration exists in app folder but not in root

**Solution**: Move migration to root:
```bash
mv apps/dashboard/supabase/migrations/20251025120000_my_migration.sql \
   supabase/migrations/20251025120000_my_migration.sql
```

### Local/Production Out of Sync
**Problem**: `migration list` shows discrepancies

**Solution**:
1. Check what's missing: `npx supabase migration list`
2. For local-only migrations: Push to production with `npx supabase db push`
3. For production-only migrations: Pull to local with `npx supabase db pull`

## Testing Migrations

### Local Testing (Required Before Production)

```bash
# 1. Create migration
npx supabase migration new my_new_feature

# 2. Write migration SQL
# Edit /supabase/migrations/TIMESTAMP_my_new_feature.sql

# 3. Test locally
npx supabase db reset

# 4. Verify schema
npx supabase db diff

# 5. If successful, push to production
npx supabase db push
```

### Verifying Migration Success

```bash
# Check migration was applied
npx supabase migration list

# Verify schema changes
npx supabase db diff --schema public

# Test database queries
# Use Supabase Studio or psql to verify
```

## Best Practices

### DO ✅
- Always test migrations locally before production
- Use descriptive migration names
- Include RLS policies with new tables
- Add indexes for frequently queried columns
- Document complex migrations with comments
- Use `IF NOT EXISTS` / `IF EXISTS` for safety
- Create one logical change per migration

### DON'T ❌
- Don't create migrations in app-specific folders
- Don't edit existing migration files (create new ones instead)
- Don't push untested migrations to production
- Don't use ambiguous names like "update.sql"
- Don't combine unrelated changes in one migration
- Don't forget RLS policies on new tables
- Don't skip migration naming convention

## Reference Commands

```bash
# Create migration
npx supabase migration new [name]

# List migrations
npx supabase migration list

# Apply migrations locally
npx supabase db reset

# Apply migrations to production
npx supabase db push

# Pull production schema
npx supabase db pull

# Check schema diff
npx supabase db diff

# Start local Supabase
npx supabase start

# Stop local Supabase
npx supabase stop
```

## Questions?

See:
- [Root CLAUDE.md](../CLAUDE.md) - Monorepo documentation
- [DATABASE_SCHEMA.md](active/DATABASE_SCHEMA.md) - Database schema reference
- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)

## Migration History

### 2025-10-25: Consolidation to Root
- **Action**: Consolidated all migrations to `/supabase/migrations/`
- **Removed**: `20251009194248_remote_schema.sql` (full dump, not a migration)
- **Removed**: `apps/dashboard/supabase/config.toml` (unused)
- **Deprecated**: All `apps/*/supabase/migrations/` folders
- **Result**: Clean, single source of truth for migrations
