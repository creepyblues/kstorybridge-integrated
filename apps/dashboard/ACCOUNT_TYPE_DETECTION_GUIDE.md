# Account Type Detection Guide - Dashboard App

**Last Updated**: 2025-01-22
**Status**: ACTIVE REFERENCE
**Scope**: Dashboard app authentication and user routing

This document provides a comprehensive reference for understanding how account type detection works in the dashboard application, distinguishing between metadata-based and database-based approaches.

## Overview

The dashboard app uses a **layered account type detection system** that balances performance with data integrity:

1. **Metadata-based detection** for fast OAuth flows
2. **Database-based detection** for authoritative user verification
3. **Hybrid approaches** for flexible scenarios
4. **Fallback mechanisms** for reliability

## Account Type Detection Mechanisms

### 1. Metadata-Based Detection (Fast & Primary for OAuth)

**File**: `src/utils/simpleAccountTypeDetection.ts`
**Function**: `getOAuthAccountType(user, urlParams)`
**Lines**: 21-74

**How it works**:
```typescript
// Priority order:
1. URL parameters: urlParams.get('account_type')
2. User metadata: user.user_metadata?.account_type
3. SessionStorage fallback: sessionStorage.getItem('oauth_account_type')
```

**When used**:
- OAuth callback processing
- Fast authentication flows
- Initial user routing decisions
- Lightweight operations

**Characteristics**:
- ✅ **Instant**: No database calls required
- ✅ **Offline capable**: Works without connectivity
- ❌ **Can be stale**: Metadata may not reflect current database state
- ❌ **OAuth dependent**: Requires proper OAuth flow setup

### 2. Database-Based Detection (Authoritative & Primary for Dashboard)

**File**: `src/hooks/useDatabaseAccountType.tsx`
**Function**: `useDatabaseAccountType(options)`
**Lines**: 39-204

**How it works**:
```typescript
// Database lookup order:
1. Query user_buyers table by user.id
2. If not found, query user_creators table by user.id
3. Return account type based on which table contains the user
4. Optional metadata fallback if database fails
```

**Query implementation**:
```typescript
// Step 1: Check user_buyers
const { data: buyerProfile } = await supabase
  .from('user_buyers')
  .select('id, email, full_name, account_type, tier')
  .eq('id', user.id)
  .maybeSingle();

// Step 2: Check user_creators
const { data: creatorProfile } = await supabase
  .from('user_creators')
  .select('id, email, full_name, account_type, pen_name, invitation_status')
  .eq('id', user.id)
  .maybeSingle();
```

**When used**:
- Dashboard entry point (`DashboardEntrypoint.tsx`)
- Profile verification flows
- When authoritative account type is required
- User existence validation

**Characteristics**:
- ✅ **Authoritative**: Always reflects current database state
- ✅ **Profile verification**: Confirms user profile exists
- ✅ **Rich data**: Returns additional profile information
- ❌ **Slower**: Requires database queries
- ❌ **Connectivity dependent**: Fails without database access

### 3. Hybrid Service Detection (Flexible)

**File**: `src/utils/simpleAccountTypeService.ts`
**Function**: `determineAccountType(user, options)`
**Lines**: 27-149

**How it works**:
```typescript
// Configurable detection flow:
1. Check URL parameters (if provided)
2. Check user metadata (always)
3. Check database (if includeDatabaseLookup: true)
4. Return default account type (if specified)
```

**Configuration options**:
```typescript
interface AccountTypeOptions {
  urlParams?: URLSearchParams;
  includeDatabaseLookup?: boolean;  // Enable database queries
  defaultAccountType?: AccountType; // Fallback value
  debug?: boolean;                  // Enable logging
  user?: User | null;              // User object
  bypassCache?: boolean;           // Force fresh lookup
}
```

**When used**:
- Flexible scenarios requiring both approaches
- Testing and debugging flows
- Migration scenarios
- Custom authentication flows

## Database Schema Alignment

### User Tables Structure

**user_buyers table**:
```typescript
{
  id: string;                    // Primary key (matches auth.users.id)
  email: string;                 // User email
  account_type: "buyer";         // Always "buyer" for this table
  tier: "invited"|"basic"|"pro"|"suite"; // Access tier
  full_name: string;            // User's full name
  buyer_company?: string;       // Company information
  buyer_role?: string;          // Role within company
  linkedin_url?: string;        // LinkedIn profile
  // ... other buyer-specific fields
}
```

**user_creators table**:
```typescript
{
  id: string;                    // Primary key (matches auth.users.id)
  email: string;                 // User email
  account_type: "creator";       // Always "creator" for this table
  pen_name?: string;            // Creator pen name or studio
  full_name: string;            // User's full name
  ip_owner_role?: string;       // Role (author, agent, etc.)
  ip_owner_company?: string;    // Company/studio information
  website_url?: string;         // Creator website
  invitation_status?: string;   // Invitation status
  // ... other creator-specific fields
}
```

**Account Type Enum**:
```typescript
account_type: "creator" | "buyer"  // Only these two values allowed
```

### Detection Logic Validation

**✅ Database queries are correctly aligned**:

1. **Primary key usage**: All database detection uses `user.id` which matches `auth.users.id`
2. **Email fallback**: Some services use `user.email` as backup lookup field
3. **Proper enum handling**: Only accepts `'buyer'` and `'creator'` values
4. **Table separation**: Correctly queries separate tables for each account type

**❌ Potential misalignments**:
- Legacy code may reference old account type values
- Metadata may contain stale or incorrect account type values
- Email-based queries could fail if email changes in auth but not profile tables

## Where Each Method is Used

### OAuth Callback Flows (Metadata-First)

**AuthCallbackPageFixed.tsx** (Lines 356-364):
```typescript
// Uses simple metadata detection for OAuth processing
const detection = getOAuthAccountType(user, urlParams);
const finalAccountType = detection.accountType;
```

**AuthCallbackPageSimple.tsx** (Lines 117-120):
```typescript
// Simple OAuth callback with metadata detection
const detection = getOAuthAccountType(user, urlParams);
const accountType = detection.accountType;
```

**Signup Forms**:
- Store account type in OAuth metadata during signup initiation
- Metadata used for callback routing and profile completion

### Dashboard Entry (Database-First)

**DashboardEntrypoint.tsx** (Lines 42-52):
```typescript
// Primary dashboard routing uses database detection
const {
  accountType,
  loading: accountTypeLoading,
  error: accountTypeError,
  source: accountTypeSource,
  profileExists
} = useDatabaseAccountType({
  user,
  enableMetadataFallback: true,
  debug: true
});
```

### Authentication Context (Metadata)

**useAuth.tsx** (Lines 28, 316-322):
```typescript
// Welcome email determination
const accountType = user.user_metadata?.account_type || 'buyer';

// Signout redirect paths
const accountType = user?.user_metadata?.account_type;
const redirectForAccount = accountType === 'creator'
  ? '/signin/creator?signed_out=true'
  : '/signin/buyer?signed_out=true';
```

### Route Protection (Metadata)

**AccountTypeProtectedRoute.tsx**:
- Uses metadata for fast route access control
- Redirects unauthorized users based on account type

## Performance & Reliability Trade-offs

### Metadata-Based Detection

**✅ Advantages**:
- **Instant response**: No network calls required
- **Offline capable**: Works without database connectivity
- **Low resource usage**: No database load
- **OAuth integration**: Naturally set during OAuth flows

**❌ Disadvantages**:
- **Potentially stale**: May not reflect current database state
- **OAuth dependent**: Requires proper OAuth flow to set correctly
- **Limited verification**: Doesn't confirm profile exists
- **Metadata corruption**: Can become inconsistent with database

**Best for**: Fast routing decisions, OAuth callbacks, lightweight operations

### Database-Based Detection

**✅ Advantages**:
- **Always authoritative**: Reflects current database state
- **Profile verification**: Confirms user profile actually exists
- **Rich information**: Returns additional profile data
- **Consistency guarantee**: Single source of truth

**❌ Disadvantages**:
- **Network dependent**: Requires database connectivity
- **Slower response**: Database query latency
- **Resource intensive**: Uses database connections
- **Failure prone**: Can fail due to network/database issues

**Best for**: Dashboard entry, profile verification, authoritative decisions

## Implementation Strategy & Best Practices

### Current Layered Approach

The dashboard app implements a **smart layered strategy**:

1. **OAuth flows**: Metadata-first for speed during authentication
2. **Dashboard entry**: Database-first for accuracy and profile verification
3. **Route protection**: Metadata for fast access control
4. **Fallback handling**: Metadata backup when database fails
5. **Session management**: Metadata for lightweight operations

### Recommended Usage Patterns

**For OAuth callbacks**:
```typescript
// Use simple metadata detection
const detection = getOAuthAccountType(user, urlParams);
if (!detection.accountType) {
  // Handle missing account type appropriately
}
```

**For dashboard entry**:
```typescript
// Use database detection with metadata fallback
const { accountType, profileExists, loading } = useDatabaseAccountType({
  user,
  enableMetadataFallback: true,
  debug: process.env.NODE_ENV === 'development'
});
```

**For route protection**:
```typescript
// Use metadata for fast decisions
const accountType = user?.user_metadata?.account_type;
const isAuthorized = accountType === 'buyer';
```

**For flexible scenarios**:
```typescript
// Use hybrid service with configuration
const result = await determineAccountType(user, {
  includeDatabaseLookup: requiresAccuracy,
  defaultAccountType: 'buyer',
  debug: true
});
```

### Error Handling Guidelines

**Database detection failures**:
```typescript
// Always provide metadata fallback
if (accountTypeError && enableMetadataFallback) {
  const metadataType = user.user_metadata?.account_type;
  if (metadataType === 'buyer' || metadataType === 'creator') {
    // Use metadata as backup
    return metadataType;
  }
}
```

**Missing account type handling**:
```typescript
// Provide clear user feedback and recovery options
if (!accountType) {
  // Log the issue for debugging
  console.error('Account type detection failed', {
    userId: user?.id,
    email: user?.email,
    metadata: user?.user_metadata
  });

  // Redirect to appropriate recovery flow
  navigate('/signin?account_type_error=true');
}
```

### Debugging and Monitoring

**Debug logging patterns**:
```typescript
// Enable detailed logging in development
const { accountType } = useDatabaseAccountType({
  user,
  debug: process.env.NODE_ENV === 'development'
});
```

**Monitoring account type mismatches**:
- Compare metadata vs database results
- Track account type detection failures
- Monitor OAuth callback success rates
- Alert on frequent fallback usage

## Migration and Maintenance

### Data Consistency Checks

Regularly verify that:
1. **Metadata matches database**: `user.user_metadata.account_type` aligns with profile table
2. **Profile completeness**: All users have corresponding profile records
3. **Enum compliance**: All account types use only `'buyer'` or `'creator'` values

### Future Improvements

**Potential optimizations**:
- Cache database results for short periods
- Implement account type change workflows
- Add account type verification endpoints
- Improve error recovery mechanisms

**Monitoring recommendations**:
- Track account type detection latency
- Monitor database vs metadata consistency
- Alert on high fallback usage rates
- Log account type determination failures

---

**For questions or updates to this documentation, refer to the authentication team or update this file directly.**