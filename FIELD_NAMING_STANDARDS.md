# Field Naming Standards

## Database Schema Consistency Guidelines

This document ensures consistent field naming across the KStoryBridge monorepo to prevent schema mismatches and development confusion.

## User Profile Fields

### IP Owner Profiles (`user_ipowners` table)

**✅ CURRENT STANDARD: `pen_name`**
- Database column: `pen_name TEXT`
- TypeScript types: `pen_name?: string | null`
- User metadata: Store as `pen_name`
- UI labels: "Pen Name/Studio"

**❌ DEPRECATED: `pen_name_or_studio`**
- Legacy field name found in old migrations
- **Do NOT use in new code**
- May exist in legacy user metadata (handle as fallback only)

### Implementation Rules

#### 1. **New User Signups** (SignupForm.tsx)
```typescript
// ✅ Correct - Store as pen_name in metadata
const metadata = {
  pen_name: formData.penNameOrStudio || null
}
```

#### 2. **Database Operations** (Profile.tsx, triggers)
```typescript
// ✅ Correct - Always use pen_name column
const profile = {
  pen_name: user.user_metadata?.pen_name || user.user_metadata?.pen_name_or_studio
}

// ✅ Correct - Database queries
.select('pen_name, ip_owner_role')
.from('user_ipowners')
```

#### 3. **Database Triggers** (Migration files)
```sql
-- ✅ Correct - Insert into pen_name column
INSERT INTO user_ipowners (pen_name, ...)
VALUES (NEW.raw_user_meta_data->>'pen_name', ...)
```

#### 4. **TypeScript Types**
```typescript
// ✅ Correct - Both dashboard and website
interface IPOwnerProfile {
  pen_name?: string | null;  // NOT pen_name_or_studio
}
```

### Migration Compatibility Strategy

To handle the transition from legacy `pen_name_or_studio` to standard `pen_name`:

1. **New Code**: Always use `pen_name`
2. **Legacy Support**: Read both fields with preference for `pen_name`
3. **Database**: Always target `pen_name` column

```typescript
// ✅ Backwards-compatible reading
const penName = user.user_metadata?.pen_name || user.user_metadata?.pen_name_or_studio;

// ✅ Forward-compatible writing
const metadata = { pen_name: penNameValue };
```

## Verification Checklist

When working with IP owner profiles, verify:

- [ ] Database operations use `pen_name` column
- [ ] TypeScript interfaces use `pen_name` field
- [ ] New metadata storage uses `pen_name` key
- [ ] Legacy metadata reading includes fallback
- [ ] Documentation references `pen_name` standard

## Files Updated for Consistency

### Active Code Files ✅
- `apps/website/src/components/SignupForm.tsx`
- `apps/website/src/integrations/supabase/types.ts`
- `apps/dashboard/src/pages/Profile.tsx`
- `apps/dashboard/src/integrations/supabase/types.ts`
- `apps/website/supabase/migrations/20250816_align_with_dashboard_schema.sql`

### Documentation Files ✅
- `CLAUDE.md` (root)
- `apps/dashboard/CLAUDE.md`
- `apps/website/CLAUDE.md`
- `DATABASE_REFERENCE.md`
- `apps/website/CREATOR_SIGNUP_SIGNIN_SUMMARY.md`
- `apps/dashboard/apply-migration.md`

### Historical Files (Unchanged)
- Older migration files (preserve historical accuracy)

## Development Guidelines

### Code Review Checklist
- [ ] New code uses `pen_name` not `pen_name_or_studio`
- [ ] Database queries target correct column names
- [ ] TypeScript types match database schema
- [ ] Metadata storage uses consistent field names

### Testing Requirements
- [ ] Test profile creation with new field names
- [ ] Test profile loading with legacy metadata
- [ ] Verify database operations succeed
- [ ] Test signup flow end-to-end

## Future Considerations

1. **Complete Migration**: Eventually remove `pen_name_or_studio` fallbacks after all users migrated
2. **Data Cleanup**: Consider script to update legacy metadata to new format
3. **Schema Validation**: Add database constraints to prevent inconsistencies

---

**Last Updated**: 2025-08-16  
**Status**: ✅ Active Standard  
**Next Review**: When legacy user metadata is fully migrated