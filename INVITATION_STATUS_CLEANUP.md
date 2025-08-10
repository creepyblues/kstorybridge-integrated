# Invitation Status Field Cleanup from user_buyers Table

This document outlines the complete cleanup of the `invitation_status` field from the `user_buyers` table, as the `tier` field now fully handles user status management.

## 🎯 Overview

The `invitation_status` field in the `user_buyers` table has been replaced by the more comprehensive `tier` system. This cleanup removes the redundant field while maintaining all existing functionality.

### Status Mapping
| Old System | New System |
|------------|------------|
| `invitation_status: 'invited'` | `tier: 'invited'` |
| `invitation_status: 'accepted'` | `tier: 'basic'` (or higher) |

## 📋 Changes Made

### 1. Code Updates

#### **packages/auth/src/authService.ts**
- ✅ Changed query from `invitation_status` to `tier` 
- ✅ Updated logic: `tier === 'invited' ? 'invited' : 'accepted'`

#### **apps/website/src/pages/SigninPage.tsx**  
- ✅ Changed buyer query from `invitation_status` to `tier`
- ✅ Updated condition: `tier && tier !== 'invited'` (instead of `=== 'accepted'`)

#### **apps/website/src/hooks/useAuth.ts**
- ✅ Changed buyer query from `invitation_status` to `tier` 
- ✅ Updated profile creation logic

### 2. Database Migrations

#### **Dashboard App**
- ✅ Created: `20250810130000-drop-invitation-status-from-user-buyers.sql`
- Drops index `user_buyers_invitation_status_idx`
- Drops column `invitation_status` from `user_buyers`

#### **Admin App**  
- ✅ Created: `20250810130000-drop-invitation-status-from-user-buyers.sql`
- Same cleanup as dashboard app

### 3. TypeScript Types

#### **Dashboard Types** (`apps/dashboard/src/integrations/supabase/types.ts`)
- ✅ Removed `invitation_status: string | null` from `user_buyers.Row`
- ✅ Removed `invitation_status?: string | null` from `user_buyers.Insert` and `Update`

#### **Admin Types** (`apps/admin/src/integrations/supabase/types.ts`)
- ✅ Same cleanup as dashboard types

## ⚠️ Files NOT Changed

These files still reference `invitation_status` but for **user_ipowners** table (not user_buyers):

- `apps/website/src/pages/SigninPage.tsx` (lines 127-129) - **IP Owner logic**
- `apps/website/src/hooks/useAuth.ts` (lines 124, 154) - **IP Owner logic** 
- `apps/website/src/components/header/AuthSection.tsx` - **Generic display**
- `packages/auth/src/authService.ts` (line 71) - **IP Owner logic**

**These are intentionally left unchanged** as IP owners still use the `invitation_status` field.

## 🚀 Migration Steps

### Step 1: Apply Code Changes
The code changes have been applied and are ready for testing.

### Step 2: Run Database Migrations
```bash
# Dashboard
cd apps/dashboard
supabase db reset

# Admin  
cd apps/admin
supabase db reset
```

### Step 3: Verify Changes
After migration, verify:
- ✅ `user_buyers` table no longer has `invitation_status` column
- ✅ `user_buyers_invitation_status_idx` index is dropped
- ✅ Buyer authentication still works with tier-based logic
- ✅ IP owner authentication continues working (unchanged)

## 🧪 Testing Checklist

### Authentication Flow Testing
- [ ] **Buyer with tier 'invited'**: Should see invited page
- [ ] **Buyer with tier 'basic'**: Should redirect to dashboard  
- [ ] **Buyer with tier 'pro'**: Should redirect to dashboard
- [ ] **Buyer with tier 'suite'**: Should redirect to dashboard
- [ ] **IP Owner with invitation_status 'invited'**: Should see creator invited page
- [ ] **IP Owner with invitation_status 'accepted'**: Should redirect to dashboard

### Database Testing
- [ ] **Migration runs successfully**: No errors during migration
- [ ] **Column dropped**: `invitation_status` no longer exists in `user_buyers`
- [ ] **Index dropped**: `user_buyers_invitation_status_idx` no longer exists
- [ ] **Tier column intact**: `tier` column still exists and functional

### App Integration Testing
- [ ] **Website auth**: All authentication flows work
- [ ] **Dashboard access**: Buyers can access dashboard based on tier
- [ ] **Admin access**: Admin can still manage user tiers
- [ ] **Cross-app consistency**: Same behavior across all three apps

## 🔍 Verification Queries

### Check Column Removal
```sql
-- Should NOT show invitation_status for user_buyers
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_buyers' AND table_schema = 'public'
ORDER BY column_name;
```

### Check Index Removal  
```sql
-- Should NOT show user_buyers_invitation_status_idx
SELECT indexname FROM pg_indexes 
WHERE tablename = 'user_buyers';
```

### Verify Tier System
```sql
-- Check current tier distribution
SELECT tier, COUNT(*) as count
FROM user_buyers 
GROUP BY tier 
ORDER BY tier;
```

## 📊 Impact Analysis

### Positive Impacts
- ✅ **Simplified Schema**: One field (`tier`) instead of two (`invitation_status` + `tier`)
- ✅ **Consistent Logic**: All buyer status logic uses tier system
- ✅ **Reduced Complexity**: Fewer fields to maintain and update
- ✅ **Better Performance**: One less column and index

### Risk Assessment
- 🟡 **Low Risk**: All functionality preserved through tier field
- 🟡 **Backward Compatibility**: Code changed to use tier instead
- 🟢 **IP Owner Unaffected**: Their `invitation_status` remains unchanged

## 🛠️ Rollback Plan (If Needed)

If rollback is required:

1. **Revert Code Changes**: 
   - Restore queries to use `invitation_status`
   - Revert authentication logic

2. **Restore Database Column**:
   ```sql
   -- Add back the column
   ALTER TABLE user_buyers ADD COLUMN invitation_status TEXT;
   
   -- Restore data from tier
   UPDATE user_buyers 
   SET invitation_status = CASE 
     WHEN tier = 'invited' THEN 'invited'
     ELSE 'accepted'
   END;
   
   -- Recreate index
   CREATE INDEX user_buyers_invitation_status_idx ON user_buyers(invitation_status);
   ```

3. **Restore TypeScript Types**: Add field back to type definitions

## 📝 Summary

The `invitation_status` field has been successfully removed from the `user_buyers` table. The `tier` field now provides the same functionality with better granularity and future-proofing for premium features.

**Status**: ✅ Cleanup Complete - Ready for Migration  
**Impact**: Low Risk - Functionality Preserved  
**Next Steps**: Run migrations and test authentication flows

---

**Document Version**: 1.0  
**Date**: August 10, 2025  
**Affected Tables**: `user_buyers` (invitation_status removed)  
**Preserved Tables**: `user_ipowners` (invitation_status preserved)