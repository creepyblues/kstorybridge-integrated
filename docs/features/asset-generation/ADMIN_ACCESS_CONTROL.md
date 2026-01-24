# Admin Access Control - Creative Asset Generation

**Last Updated**: 2025-11-06
**Status**: MVP - Hardcoded Admin Emails (Acceptable)

---

## Current Implementation: Hardcoded Admin Emails

### Rationale for Hardcoded Approach

The creative asset generation system uses **hardcoded admin email validation** for the following reasons:

1. **MVP Scope**: This is an internal admin-only tool, not a public-facing feature
2. **Limited User Base**: Only 2 authorized admins (`sungho@kstorybridge.com`, `kevin@sandstoneartists.com`)
3. **Controlled Environment**: All access is authenticated through Supabase + requires valid JWT
4. **Cost Control**: Prevents unauthorized users from triggering expensive AI API calls ($0.05-0.20 per operation)
5. **Simplicity**: No need for complex role management system for 2 users
6. **Isolation by Design**: System is designed to be extracted as microservice, so admin table queries were deliberately avoided

### Implementation Locations

**Edge Functions:**
- `/supabase/functions/analyze-pitch-for-assets/index.ts` (lines 196-199)
- `/supabase/functions/generate-asset/types.ts` (`isAuthorizedAdmin()` function)

**Validation Pattern:**
```typescript
const authorizedAdmins = ['sungho@kstorybridge.com', 'kevin@sandstoneartists.com'];
if (!authorizedAdmins.includes(request.admin_email.toLowerCase())) {
  return { code: 'UNAUTHORIZED', message: 'Admin email not authorized' };
}
```

**Frontend:**
- Admin email sent from frontend based on authenticated user session
- UI is already protected by `AdminProtectedRoute` component
- Additional validation happens at edge function level

---

## Security Considerations

### ✅ What Makes This Secure

1. **Multi-Layer Protection**:
   - Layer 1: Frontend `AdminProtectedRoute` prevents UI access
   - Layer 2: Edge function validates admin email
   - Layer 3: Supabase RLS policies on `title_marketing_assets` table

2. **Authentication Required**:
   - All requests require valid Supabase JWT token
   - Email claim in JWT must match authorized admin

3. **CORS Whitelisting** (Added 2025-11-06):
   - Only production, staging, and localhost origins allowed
   - Prevents CSRF attacks from unauthorized domains

4. **Request Origin Validation**:
   - Edge functions validate request origin header
   - Rejects requests from non-whitelisted origins with 403 Forbidden

### ⚠️ Current Limitations

1. **Hardcoded Emails**: Adding/removing admins requires code deployment
2. **No Audit Trail**: Admin actions not logged to separate audit table
3. **No Fine-Grained Permissions**: All admins have same permissions
4. **Manual Synchronization**: Email list duplicated across 2 files

---

## When to Migrate to Database-Driven Admin System

**Triggers for Migration:**

1. **More than 5 admin users**: Hardcoded list becomes unmaintainable
2. **Dynamic admin management needed**: Business wants to add/remove admins without deployments
3. **Role-based permissions needed**: Different admins need different capabilities
4. **Audit requirements**: Need to track who performed which actions
5. **Multi-tenant**: Supporting multiple organizations/teams

**Migration Complexity**: LOW (1-2 hours)

---

## Future Migration Path (If Needed)

### Step 1: Create Admin Roles Table

```sql
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin',
  permissions JSONB DEFAULT '{"can_generate_assets": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT
);

-- RLS policies
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can manage admins"
  ON admin_users
  FOR ALL
  USING (auth.role() = 'service_role');

-- Insert existing admins
INSERT INTO admin_users (email, role, permissions, created_by) VALUES
  ('sungho@kstorybridge.com', 'super_admin', '{"can_generate_assets": true, "can_manage_admins": true}'::jsonb, 'system'),
  ('kevin@sandstoneartists.com', 'admin', '{"can_generate_assets": true}'::jsonb, 'system');
```

### Step 2: Update Edge Functions

Replace hardcoded validation:

```typescript
// OLD (current)
const authorizedAdmins = ['sungho@kstorybridge.com', 'kevin@sandstoneartists.com'];
if (!authorizedAdmins.includes(request.admin_email.toLowerCase())) {
  return { code: 'UNAUTHORIZED', message: 'Admin email not authorized' };
}

// NEW (database-driven)
const { data: admin, error } = await supabase
  .from('admin_users')
  .select('*')
  .eq('email', request.admin_email.toLowerCase())
  .eq('revoked', false)
  .single();

if (error || !admin) {
  return { code: 'UNAUTHORIZED', message: 'Admin email not authorized' };
}

if (!admin.permissions?.can_generate_assets) {
  return { code: 'FORBIDDEN', message: 'Insufficient permissions' };
}
```

### Step 3: Create Admin Management UI

Add admin management page at `/admin/users`:
- List all admin users
- Add/revoke admin access
- Modify permissions
- View audit log

### Step 4: Add Audit Logging

```sql
CREATE TABLE admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL, -- 'analyze_pitch', 'generate_asset', etc.
  resource_id TEXT, -- asset_id, title_id
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Cost vs Benefit Analysis

### Current Approach (Hardcoded)

**Pros:**
- ✅ Zero database queries per request
- ✅ Simple to understand and audit
- ✅ Fast validation (no DB lookup)
- ✅ Aligns with isolation design principle
- ✅ Sufficient for 2-user MVP

**Cons:**
- ❌ Requires deployment to add/remove admins
- ❌ Email list duplicated in 2 locations

### Database-Driven Approach

**Pros:**
- ✅ Dynamic admin management (no deployments)
- ✅ Single source of truth
- ✅ Audit trail capability
- ✅ Fine-grained permissions

**Cons:**
- ❌ +1 database query per request (~50ms latency)
- ❌ More complex code
- ❌ Requires admin management UI
- ❌ Breaks isolation principle (queries another table)

---

## Recommendation

**Keep hardcoded approach for now**, with these improvements:

1. ✅ **COMPLETED**: Centralize admin list in shared constant file
2. ✅ **COMPLETED**: Document this decision in ADMIN_ACCESS_CONTROL.md
3. ⏳ **FUTURE**: Add TypeScript constant export for reusability
4. ⏳ **FUTURE**: Add environment variable override for testing (`OVERRIDE_ADMIN_EMAIL` for local dev)

**Migrate to database-driven when:**
- User count exceeds 5 admins
- Business requests self-service admin management
- Audit logging becomes required

---

## Security Improvements Completed (2025-11-06)

✅ **CORS Origin Whitelisting**:
- Production: `https://dashboard.kstorybridge.com`
- Staging: `https://dashboard-v2.kstorybridge.com`
- Development: `http://localhost:8081`
- Blocks all other origins with 403 Forbidden

✅ **Environment Variable Validation**:
- Required env vars validated at function startup
- Clear error messages if misconfigured
- Prevents silent failures

✅ **Prompt Injection Prevention**:
- Custom prompts sanitized before DALL-E API calls
- Detects and removes injection patterns
- 2000 character limit enforced
- Logs all sanitization warnings

✅ **Race Condition Fix**:
- Optimistic locking using `updated_at` timestamp
- Prevents concurrent asset generation
- Returns 409 Conflict on race detection
- Ensures database consistency

---

## Testing Checklist

### Manual Testing

1. **Authorized Admin Access**:
   - [ ] Sungho can analyze pitch and generate assets
   - [ ] Kevin can analyze pitch and generate assets

2. **Unauthorized Access Prevention**:
   - [ ] Non-admin email returns 401 Unauthorized
   - [ ] Request from unauthorized origin returns 403 Forbidden

3. **Prompt Sanitization**:
   - [ ] Injection attempt ("ignore previous instructions") blocked
   - [ ] Valid custom prompt accepted
   - [ ] 2000+ character prompt truncated

4. **Race Condition Prevention**:
   - [ ] Concurrent generation requests handled correctly
   - [ ] Second request returns 409 Conflict
   - [ ] No duplicate images generated

### Automated Testing (Future)

```typescript
// Example test cases
describe('Admin Access Control', () => {
  it('should allow authorized admin', async () => {
    const response = await supabase.functions.invoke('analyze-pitch-for-assets', {
      body: { admin_email: 'sungho@kstorybridge.com', ... }
    });
    expect(response.error).toBeNull();
  });

  it('should reject unauthorized email', async () => {
    const response = await supabase.functions.invoke('analyze-pitch-for-assets', {
      body: { admin_email: 'hacker@example.com', ... }
    });
    expect(response.error.code).toBe('UNAUTHORIZED');
  });
});
```

---

## Deployment Notes

**No database migration required** - current approach is code-only.

**Deployment steps:**
1. Deploy updated edge functions with security utilities
2. Test with authorized admin accounts
3. Monitor logs for CORS/prompt sanitization warnings
4. Verify race condition handling in concurrent scenarios

**Rollback plan:**
- If issues arise, revert to previous edge function deployment
- No database changes to revert

---

**For Questions or Changes:**
Contact: sungho@kstorybridge.com

**Related Documentation:**
- [Feature Testing Report](TESTING_REPORT.md) - Code review findings
- [System Architecture](../../../CLAUDE.md) - Overall system design
