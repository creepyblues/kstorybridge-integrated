# Table Rename Impact Analysis: user_ipowners → user_creators

## Overview
This document analyzes all potential breaking scenarios when renaming the `user_ipowners` table to `user_creators` and provides solutions for each.

## ✅ Code Changes Completed

### Frontend Applications
- ✅ **Dashboard App** - Updated all references in:
  - `SignupForm.tsx` - OAuth creator profile creation
  - `AccountTypeProtectedRoute.tsx` - Account type detection
  - `RootRedirect.tsx` - Smart routing logic
  - `useAuth.tsx` - Welcome email handling
  - `AuthCallbackPage.tsx` - Profile checking
  - `Profile.tsx` - Profile CRUD operations
  - `SigninPage.tsx` - Creator authentication
  - `debugProfile.ts` - Debug utilities

- ✅ **Website App** - Updated:
  - `testSupabaseConnection.ts` - Connection testing
  - `types.ts` - TypeScript definitions

- ✅ **Shared Packages** - Updated:
  - `packages/auth/src/authService.ts`

## 🔄 Database Migration Required

### Supabase Database Changes
**SQL Migration Script Created:** `RENAME_TABLE_user_ipowners_to_user_creators.sql`

This script handles:
- ✅ Table creation with identical structure
- ✅ Data migration (preserves all existing records)
- ✅ Constraint recreation (Primary Key, Foreign Keys)
- ✅ Index recreation (email, invitation_status)
- ✅ RLS policy migration
- ✅ Trigger function updates
- ✅ Data integrity verification

## ⚠️ Potential Breaking Scenarios & Solutions

### 1. **Authentication & Signup Flows**
**Risk Level: 🔴 HIGH**

**Affected Areas:**
- Creator email signup
- Creator OAuth signup (Google)
- Creator signin
- Profile creation during signup

**Potential Issues:**
- New creators cannot be created
- Existing creators cannot sign in
- Profile lookups fail

**Testing Required:**
```bash
# Test creator signup flows
1. Email signup as creator
2. Google OAuth signup as creator
3. Signin as existing creator
4. Profile management for creators
```

### 2. **Route Protection & User Type Detection**
**Risk Level: 🔴 HIGH**

**Affected Areas:**
- `/creators/*` route access
- Account type-based redirects
- Dashboard home routing

**Potential Issues:**
- Creators redirected to buyer dashboard
- Access denied to creator routes
- Infinite redirect loops

**Testing Required:**
```bash
# Test route protection
1. Creator accessing /creators/home
2. Creator accessing /buyers/home (should redirect)
3. Root redirect (/) for creators
4. Deep links to creator pages
```

### 3. **Profile Management**
**Risk Level: 🟡 MEDIUM**

**Affected Areas:**
- Profile page editing
- Profile creation for OAuth users
- Profile data display

**Potential Issues:**
- Profile updates fail
- Profile creation errors
- Missing profile data

### 4. **Database Triggers & Background Processes**
**Risk Level: 🟡 MEDIUM**

**Affected Areas:**
- `handle_new_user_routing()` trigger function
- Automatic profile creation
- User metadata synchronization

**Potential Issues:**
- New signups fail silently
- Profiles not created automatically
- Metadata inconsistencies

### 5. **External Integrations**
**Risk Level: 🟡 MEDIUM**

**Areas to Check:**
- Admin panel queries
- Analytics or reporting scripts
- Backup/export processes
- Third-party integrations

## 🧪 Testing Checklist

### Pre-Migration Tests
- [ ] Backup current `user_ipowners` table
- [ ] Test current creator signup flow
- [ ] Test current creator signin flow
- [ ] Test profile management
- [ ] Document current record count

### Migration Execution
- [ ] Run migration script in transaction
- [ ] Verify data integrity (record counts match)
- [ ] Test basic query on new table
- [ ] Verify constraints and indexes
- [ ] Check RLS policies

### Post-Migration Tests

#### **Authentication Flows**
- [ ] Creator email signup
- [ ] Creator OAuth (Google) signup  
- [ ] Creator signin with existing account
- [ ] Creator password reset
- [ ] Cross-domain auth (website → dashboard)

#### **Route Protection**
- [ ] Creator accessing `/creators/home`
- [ ] Creator accessing `/buyers/home` (should redirect)
- [ ] Buyer accessing `/creators/home` (should redirect) 
- [ ] Root redirect `/` for creators
- [ ] Deep linking to creator pages

#### **Profile Management**
- [ ] View creator profile
- [ ] Edit creator profile
- [ ] Save profile changes
- [ ] Profile creation for new OAuth users

#### **Database Operations**
- [ ] New creator signup creates profile
- [ ] Trigger function works correctly
- [ ] RLS policies enforce access control
- [ ] All indexes functioning

### Performance & Monitoring
- [ ] Check application logs for errors
- [ ] Monitor signup completion rates
- [ ] Verify authentication success rates
- [ ] Test page load times

## 🚨 Rollback Plan

If issues are discovered:

1. **Immediate Actions:**
   ```sql
   -- Quick restore trigger function
   -- (See rollback section in migration script)
   ```

2. **Full Rollback:**
   - Restore original trigger function
   - Drop `user_creators` table
   - Revert all code changes
   - Redeploy applications

3. **Data Recovery:**
   - Original `user_ipowners` table preserved during migration
   - Can copy data back if needed

## 📋 Deployment Checklist

### Before Deployment
- [ ] All code changes tested locally
- [ ] Build passes for all applications
- [ ] Migration script reviewed and tested on staging
- [ ] Rollback plan documented and tested

### During Deployment
- [ ] Deploy code changes first (they're backward compatible)
- [ ] Run database migration
- [ ] Verify migration success
- [ ] Test critical flows immediately
- [ ] Monitor error logs

### After Deployment
- [ ] Full testing checklist completed
- [ ] Monitor application metrics
- [ ] Verify no increase in error rates
- [ ] Document any issues found
- [ ] Plan old table cleanup (after verification period)

## 🔍 Additional Areas to Review

### Documentation Updates Needed
- [ ] Update API documentation
- [ ] Update database schema docs
- [ ] Update developer onboarding guides
- [ ] Update troubleshooting guides

### External Dependencies
- [ ] Check admin panel functionality
- [ ] Verify any reporting dashboards
- [ ] Update any external scripts or tools
- [ ] Check backup/restore procedures

### Security Considerations
- [ ] Verify RLS policies work correctly
- [ ] Test unauthorized access attempts
- [ ] Confirm data isolation between users
- [ ] Check audit logs functionality

## 📊 Success Metrics

**Key Indicators:**
- Creator signup success rate remains stable
- Creator signin success rate remains stable  
- No increase in authentication errors
- No increase in database query errors
- Route protection working correctly

**Monitoring Period:**
- Watch metrics for 24-48 hours post-migration
- Plan old table cleanup after 1 week of stable operation

## 🛠️ Additional SQL Commands

### Verification Queries
```sql
-- Check record counts match
SELECT 'user_ipowners' as table_name, COUNT(*) FROM user_ipowners
UNION ALL
SELECT 'user_creators' as table_name, COUNT(*) FROM user_creators;

-- Verify data integrity
SELECT COUNT(*) as missing_records
FROM user_ipowners old
LEFT JOIN user_creators new ON old.id = new.id
WHERE new.id IS NULL;

-- Check recent creator signups work
SELECT * FROM user_creators 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Clean-up Commands (After Verification)
```sql
-- Create backup before cleanup
CREATE TABLE user_ipowners_backup AS SELECT * FROM user_ipowners;

-- Drop old table (only after everything is verified)
DROP TABLE user_ipowners CASCADE;
```

## 🎯 Final Recommendations

1. **Timing**: Execute during low-traffic period
2. **Monitoring**: Have team members monitoring during migration
3. **Communication**: Notify users of brief maintenance window
4. **Rollback**: Be prepared to rollback quickly if issues arise
5. **Verification**: Thoroughly test before declaring success

The migration is designed to be safe and reversible, but proper testing and monitoring are essential for success.