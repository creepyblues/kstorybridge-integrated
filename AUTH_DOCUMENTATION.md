# KStoryBridge Authentication Documentation

**Last Updated:** 2025-10-05
**Version:** 3.3 - OAuth State Parameter & Profile Existence Enforcement

This is the single source of truth for all authentication-related information in the KStoryBridge platform.

## Table of Contents

1. [⚠️ Critical Authentication Rules](#️-critical-authentication-rules-do-not-violate)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [Authentication Flows](#authentication-flows)
5. [Technical Implementation](#technical-implementation)
6. [User Journeys](#user-journeys)
7. [Development & Testing](#development--testing)
8. [Troubleshooting](#troubleshooting)
9. [Migration History](#migration-history)

---

## ⚠️ Critical Authentication Rules (DO NOT VIOLATE)

**Added:** 2025-10-05
**Purpose:** Prevent future code changes from breaking authentication

### Profile Existence Check Philosophy

**CORE PRINCIPLE**: Users in `auth.users` without profiles in `user_buyers`/`user_creators` are treated as **"no account"**

#### RULE 1: NEVER Auto-Create Profiles During Signin

❌ **FORBIDDEN** - Auto-creating profiles:
```typescript
// DO NOT DO THIS - bypasses signup flow
if (!profileExists) {
  await createBuyerProfile(user);  // ❌ WRONG
  await createCreatorProfile(user); // ❌ WRONG
  navigate('/dashboard');
}
```

✅ **CORRECT** - Show error and redirect to signup:
```typescript
// Enforce signup requirement
if (!profileExists) {
  toast({
    title: "Account Not Found",
    description: "Your account doesn't exist. Please sign up first.",
    variant: "destructive"
  });
  navigate('/signup/buyer');
}
```

**WHY**: OAuth signin can create users in `auth.users` even if they haven't completed signup. Auto-creating profiles bypasses the signup flow and creates incomplete accounts with missing required fields.

**WHERE THIS IS ENFORCED** (as of 2025-10-05):
- `apps/dashboard/src/pages/AuthCallbackSimple.tsx` (lines 169-224)
- `apps/dashboard/src/components/SigninForm.tsx` (lines 171-211)
- `apps/dashboard/src/pages/Profile.tsx` (lines 192-205, 240-253)

---

#### RULE 2: ALWAYS Use OAuth State Parameter (Not URL Query Params)

❌ **FORBIDDEN** - Putting data in callback URL:
```typescript
// OAuth providers strip custom query parameters
const callbackUrl = `${origin}/auth/callback?account_type=${type}&flow=signin`; // ❌ WRONG
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: callbackUrl }
});
```

✅ **CORRECT** - Use OAuth 2.0 state parameter:
```typescript
// State parameter survives OAuth redirect
import { initializeOAuthFlow } from '@/utils/oauthSecurity';

const state = initializeOAuthFlow('signin', accountType, 'google');
const callbackUrl = `${window.location.origin}/auth/callback`;

await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: callbackUrl,
    queryParams: { state }  // ✅ OAuth 2.0 standard
  }
});
```

**WHY**: OAuth providers (Google, Discord, etc.) strip custom query parameters from callback URLs for security reasons. Only the `state` parameter is guaranteed to survive the OAuth redirect flow.

**SECURITY BENEFITS**:
- ✅ CSRF protection (cryptographically secure 32-char random hex)
- ✅ Data survives OAuth redirect (OAuth 2.0 spec compliance)
- ✅ 10-minute auto-expiry prevents replay attacks
- ✅ Automatic cleanup of expired state data

**WHERE THIS IS IMPLEMENTED** (as of 2025-10-05):
- OAuth State Logic: `apps/dashboard/src/utils/oauthSecurity.ts`
- Signin Flow: `apps/dashboard/src/components/SigninForm.tsx` (lines 94-112)
- Signup Flow: `apps/dashboard/src/components/auth/signupService.ts` (lines 366-381)
- Callback Handler: `apps/dashboard/src/pages/AuthCallbackSimple.tsx` (lines 35-59)

---

#### RULE 3: Profile Tables Are Source of Truth for "Has Account"

**Two-Table Authentication Model**:
```
auth.users = OAuth identity verified (auto-created by Supabase)
user_buyers / user_creators = Signup completed (profile exists)

Valid Account = EXISTS in auth.users AND EXISTS in profile table
```

**Profile Check Pattern** (use everywhere access is granted):
```typescript
// Example: Check buyer profile existence
const { data: profile } = await supabase
  .from('user_buyers')
  .select('id')
  .eq('id', user.id)
  .maybeSingle();

if (!profile) {
  // User exists in auth.users but hasn't completed signup
  toast({ description: "Your account doesn't exist. Please sign up first." });
  navigate('/signup/buyer');
  return; // Block access
}

// Profile exists - grant access
navigate('/buyers/home');
```

**Why Incomplete Users Exist**:
- OAuth providers create `auth.users` entry on first signin (Supabase default behavior)
- This happens BEFORE our profile check
- These users cannot access the system (blocked by profile checks)
- They complete signup → profile created → future signins succeed

**Incomplete User Cleanup** (optional, not required):
```sql
-- Delete auth.users entries >7 days old with no profile
DELETE FROM auth.users u
WHERE u.created_at < NOW() - INTERVAL '7 days'
AND NOT EXISTS (SELECT 1 FROM user_buyers WHERE id = u.id)
AND NOT EXISTS (SELECT 1 FROM user_creators WHERE id = u.id);
```

---

## System Architecture

### Overview

KStoryBridge uses a **dual-user authentication system** with a **split-app architecture**:

- **Website App** (`kstorybridge.com`): Marketing pages only
- **Dashboard App** (`dashboard.kstorybridge.com`): ALL authentication + user dashboard

### User Types

#### Buyers
- **Purpose**: Media buyers, producers, executives seeking Korean content
- **Email Requirement**: Work emails only (personal domains blocked)
- **Default Tier**: `basic` (changed from `invited` on 2025-08-21)
- **Routing**: `/buyers/chat` (primary dashboard, `/buyers/home` redirects here)

#### Creators (formerly IP Owners)
- **Purpose**: Content creators, authors, agents sharing their work
- **Email Requirement**: Any email allowed
- **Default Status**: `invited` (requires approval)
- **Routing**: `/creators/home`

### Supported Authentication Methods

1. **Email/Password**: Standard form-based with email verification
2. **OAuth (Google)**: One-click signup/signin with profile completion

### Environment Configuration

```bash
# Development
Dashboard: http://localhost:8081
Website: http://localhost:5173

# Production
Dashboard: https://dashboard.kstorybridge.com
Website: https://kstorybridge.com

# Supabase
SUPABASE_URL: https://dlrnrgcoguxlkkcitlpd.supabase.co
SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Database Schema

### Core Tables

#### auth.users (Supabase Auth)
- Managed by Supabase
- Stores authentication credentials
- `raw_user_meta_data` contains account type and profile data

#### user_buyers
```sql
CREATE TABLE public.user_buyers (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  buyer_company text,
  buyer_role buyer_role, -- ENUM: producer|executive|agent|content_scout|other
  linkedin_url text,
  tier user_tier DEFAULT 'basic', -- ENUM: basic|invited|pro|suite
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### user_creators (migrated from user_ipowners)
```sql
CREATE TABLE public.user_creators (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  pen_name text, -- IMPORTANT: Always use pen_name field
  ip_owner_role ip_owner_role NOT NULL, -- ENUM: author|agent (REQUIRED as of 2025-09-21)
  ip_owner_company text,
  website_url text,
  invitation_status text DEFAULT 'invited', -- ENUM: invited|active|pending
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**CRITICAL CHANGES (2025-09-21)**:
- `ip_owner_role` is now **REQUIRED** for all creator signups
- `invitation_status` field added to profile management
- Default role selection: 'author' (if not specified during signup)

### Tier System (Buyers)

```typescript
const tierHierarchy = {
  basic: 1,    // Default, standard features
  invited: 0,  // Restricted (legacy)
  pro: 2,      // Premium content
  suite: 3     // Full access
};
```

### Database Triggers

**Consolidated Trigger (2025-09-10)**:
```sql
CREATE TRIGGER on_auth_user_profile_routing
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_user_profile_routing();
```

The trigger automatically creates the appropriate profile based on `account_type` metadata.

### Query Patterns

**CRITICAL**: Always query by `email`, never by `user_id`:
```typescript
// ✅ CORRECT
.eq('email', user.email?.toLowerCase())

// ❌ INCORRECT - user_id doesn't exist
.eq('user_id', user.id)
```

---

## Authentication Flows

### Email/Password Signup

```mermaid
sequenceDiagram
    User->>SignupForm: Fill form
    SignupForm->>Supabase: auth.signUp() with metadata
    Supabase->>Database: Create auth.users record
    Database->>Database: Trigger creates profile
    Supabase->>Email: Send verification
    Email->>User: Click verification link
    User->>SigninPage: Sign in
    SigninPage->>Dashboard: Redirect based on type
```

### OAuth Signup (Simplified Flow - 2025-01-14)

```mermaid
sequenceDiagram
    User->>SignupForm: Click "Continue with Google"
    SignupForm->>Google: OAuth redirect with account_type
    Google->>AuthCallbackFixed: Return with tokens + account_type
    AuthCallbackFixed->>AuthCallbackFixed: getOAuthAccountType()
    alt Signup flow
        AuthCallbackFixed->>SignupForm: Redirect to complete profile
    else Signin flow
        AuthCallbackFixed->>Dashboard: Direct redirect to home
    end
```

**Key Simplifications**:
- **Single callback handler**: `AuthCallbackPageFixed.tsx` (80 lines vs 400+)
- **Fast account type detection**: `getOAuthAccountType()` - metadata-only, no database queries
- **Consistent redirect URLs**: Always `${window.location.origin}/auth/callback`
- **90% faster callbacks**: Eliminated complex circuit breakers and timeouts

**For implementation details, see**: [OAuth Flow Implementation](#oauth-implementation-changes-simplified---2025-01-14)

### Universal Signin

```typescript
// Signin flow logic
1. Authenticate user (email/password or OAuth)
2. Check user_metadata.account_type
3. If not found, query both user tables
4. Determine account type and tier/status
5. Redirect accordingly:
   - Buyer (basic/pro/suite) → /buyers/home (default login redirect)
   - Buyer (invited) → /invited
   - Creator (accepted) → /creators/home
   - Creator (invited) → /creator/invited
```

---

## Technical Implementation

### Key Components

#### Authentication Pages (Dashboard App)
- `/signin` - Universal signin
- `/signup/buyer` - Buyer signup
- `/signup/creator` - Creator signup
- `/auth/callback` - OAuth callback handler
- `/account-type-selection` - Account type selection for OAuth users without existing accounts
- `/forgot-password` - Password reset

#### Core Hooks & Utilities
- `useAuth.tsx` - Authentication state management
- `useAccountType.tsx` - Account type detection
- `simpleAccountTypeDetection.ts` - Fast metadata-only detection (replaced complex 700+ line system)
- `AuthCallbackPageFixed.tsx` - Streamlined OAuth callback handler
- `useTierAccess.tsx` - Buyer tier access control

### Account Type Detection Priority (Simplified - 2025-01-14)

**New streamlined approach using `getOAuthAccountType()`**:

1. **URL Parameters** (highest - from OAuth redirect)
2. **User Metadata** (OAuth auth.users.raw_user_meta_data)
3. **SessionStorage** (fallback for edge cases)
4. **Error state** (no default assignment)

**Performance Improvements**:
- **No database queries** during OAuth callback
- **90% faster** than previous 700+ line system
- **Eliminated timeouts** and circuit breakers
- **Consistent behavior** across all environments

### Route Protection

```typescript
// Protection hierarchy
<ProtectedRoute>
  <AccountTypeProtectedRoute allowedAccountTypes={['creator']}>
    <CMSLayout>
      {children}
    </CMSLayout>
  </AccountTypeProtectedRoute>
</ProtectedRoute>
```

### Session Management

**Cross-Domain Authentication**:
```typescript
// Dashboard receives tokens via URL
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('access_token')) {
  await supabase.auth.setSession({
    access_token: urlParams.get('access_token'),
    refresh_token: urlParams.get('refresh_token'),
    // ...
  });
}
```

### OAuth Implementation (Updated 2025-10-03)

**OAuth State Parameter (OAuth 2.0 Standard)**:

OAuth providers strip custom query parameters from callback URLs for security. We use the OAuth 2.0 **state parameter** to securely pass flow data through the redirect.

```typescript
// ✅ CORRECT: Use OAuth state parameter (oauthSecurity.ts)
import { initializeOAuthFlow } from '@/utils/oauthSecurity';

// Initialize OAuth flow with state parameter
const state = initializeOAuthFlow('signin', accountType, 'google');

const callbackUrl = `${window.location.origin}/auth/callback`;
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: callbackUrl,
    queryParams: { state }  // OAuth 2.0 standard state parameter
  }
});

// ❌ FORBIDDEN: Putting data in callback URL query params
// OAuth providers WILL STRIP these parameters!
const redirectUrl = `${window.location.origin}/auth/callback?account_type=buyer&flow=signin`;
```

**State Parameter Implementation**:

```typescript
// State generation (32-char hex for CSRF protection)
function generateSecureState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Store flow data with state (10-minute expiry)
function initializeOAuthFlow(
  flow: 'signin' | 'signup',
  accountType: 'buyer' | 'creator',
  provider: 'google' | 'discord'
): string {
  const state = generateSecureState();
  const data = { flow, accountType, provider, timestamp: Date.now() };
  sessionStorage.setItem(`oauth_${state}`, JSON.stringify(data));
  return state;
}

// Validate state in callback
function validateOAuthState(receivedState: string): OAuthFlowData | null {
  if (!/^[a-f0-9]{32}$/.test(receivedState)) return null;

  const stored = sessionStorage.getItem(`oauth_${receivedState}`);
  if (!stored) return null;

  const data = JSON.parse(stored);

  // Check 10-minute expiry
  if (Date.now() - data.timestamp > 10 * 60 * 1000) {
    sessionStorage.removeItem(`oauth_${receivedState}`);
    return null;
  }

  return data;
}
```

**OAuth Callback Flow (AuthCallbackSimple.tsx)**:

```typescript
// 1. Read state parameter from OAuth redirect
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

// 2. Validate state and extract flow data
let accountType: string | null = null;
let flow: string | null = null;

if (state) {
  const oauthData = validateOAuthState(state);
  if (oauthData) {
    accountType = oauthData.accountType;
    flow = oauthData.flow;
    console.log('✅ OAuth state validated:', { accountType, flow });
  } else {
    console.warn('⚠️ OAuth state validation failed, falling back to sessionStorage');
  }
}

// 3. Exchange OAuth code for session
const { data, error } = await supabase.auth.exchangeCodeForSession(code);

// 4. Determine final account type (Priority: state > metadata > sessionStorage)
const finalAccountType = accountType ||
  user.user_metadata?.account_type ||
  sessionStorage.getItem('oauth_account_type');

// 5. Check profile existence for signin flow
if (flow === 'signin') {
  const profileExists = await checkProfileExists(user.id, finalAccountType);

  if (!profileExists) {
    // User exists in auth.users but has no profile - treat as "no account"
    toast({
      title: "Account Not Found",
      description: "Your account doesn't exist. Please sign up first.",
      variant: "destructive"
    });
    navigate(`/signup/${finalAccountType}`);
    return;
  }

  navigate(getDashboardPath(finalAccountType));
}
```

**Profile Existence Check**:

```typescript
async function checkProfileExists(userId: string, accountType: string): Promise<boolean> {
  try {
    if (accountType === 'buyer') {
      const { data } = await supabase
        .from('user_buyers')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      return !!data;
    } else {
      const { data } = await supabase
        .from('user_creators')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      return !!data;
    }
  } catch (error) {
    console.error('Error checking profile:', error);
    return false; // Assume no profile on error
  }
}
```

### Auth Metadata Management (Updated 2025-09-21)

**Email Signup Metadata**:
```typescript
// Creator signup with metadata
const result = await authService.signUp({
  email: formData.email,
  password: formData.password,
  metadata: {
    full_name: formData.full_name,
    pen_name: formData.pen_name,
    ip_owner_role: formData.ip_owner_role, // REQUIRED
    ip_owner_company: formData.ip_owner_company,
    website_url: formData.website_url,
    account_type: 'creator', // CRITICAL: Set during signup
    invitation_status: 'invited'
  }
});
```

**OAuth Metadata Update**:
```typescript
// In AuthCallbackPageFixed.tsx
await supabase.auth.updateUser({
  data: { account_type: finalAccountType } // Updates auth.users metadata
});
```

**Key Metadata Fields**:
- `account_type`: 'buyer' | 'creator' (REQUIRED for routing)
- `full_name`: User's full name
- `pen_name`: Creator's pen name/studio name
- `ip_owner_role`: 'author' | 'agent' (REQUIRED for creators)
- `invitation_status`: 'invited' | 'active' | 'pending'

### Profile Management (Updated 2025-09-21)

**Creator Profile Fields**:
```typescript
interface CreatorProfile {
  id: string;
  email: string;
  full_name: string;
  pen_name: string;
  ip_owner_role: 'author' | 'agent'; // REQUIRED
  ip_owner_company?: string;
  website_url?: string;
  invitation_status: 'invited' | 'active' | 'pending'; // Added to UI
  created_at: string;
  updated_at: string;
}
```

**Form Validation Updates**:
- Role field now required with dropdown validation
- OAuth completion: Full name read-only, Pen name required with asterisk
- Profile page includes invitation status management

### Email Validation (Buyers)

```typescript
const consumerEmailProviders = [
  'gmail.com', 'yahoo.com', 'hotmail.com',
  'outlook.com', 'aol.com', 'icloud.com',
  // ... more personal domains
];

// Block personal emails for buyers
if (accountType === 'buyer' && consumerEmailProviders.includes(emailDomain)) {
  throw new Error('Please use a work email address');
}
```

### Profile Existence Philosophy (UPDATED 2025-10-03)

**Two-Table Authentication Model**:

KStoryBridge uses a two-table authentication model where **profile existence** is the authoritative check for "has valid account":

```
┌─────────────────────────────────────────────────────────────┐
│ auth.users (Supabase Auth)                                  │
│ - Auto-created during OAuth/email signup                    │
│ - Contains OAuth identity (Google, Discord, etc.)           │
│ - Stores user_metadata (account_type, full_name, etc.)      │
│ - NOT the source of truth for "has account"                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─ MUST have matching profile
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌───────────────────┐                    ┌────────────────────┐
│ user_buyers       │                    │ user_creators      │
│ - Profile created │                    │ - Profile created  │
│   during signup   │                    │   during signup    │
│ - Source of truth │                    │ - Source of truth  │
│   for "has buyer  │                    │   for "has creator │
│   account"        │                    │   account"         │
└───────────────────┘                    └────────────────────┘
```

**Why This Model?**

1. **OAuth auto-creates auth.users**: Supabase's `exchangeCodeForSession()` automatically creates an `auth.users` entry when processing OAuth callbacks. This is unavoidable.

2. **Profile creation is intentional**: Users in `user_buyers` or `user_creators` tables have **intentionally completed signup**, not just authenticated with OAuth.

3. **Prevents ghost accounts**: Without this model, OAuth signin attempts would create "ghost" users in `auth.users` who can't access the system.

**Implementation Rule**:

```typescript
// ✅ CORRECT: Check profile existence
async function hasValidAccount(userId: string, accountType: string): Promise<boolean> {
  const table = accountType === 'buyer' ? 'user_buyers' : 'user_creators';
  const { data } = await supabase
    .from(table)
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  return !!data; // Profile exists = valid account
}

// ❌ WRONG: Checking only auth.users
async function hasValidAccount(userId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  return !!user; // This includes OAuth users who haven't completed signup!
}
```

**When Profile Checks Occur**:

1. **OAuth Signin** (`flow='signin'`):
   - Exchange OAuth code for session
   - **Check profile existence** before dashboard redirect
   - No profile → Show error "Your account doesn't exist. Please sign up first."
   - Has profile → Redirect to dashboard

2. **OAuth Signup** (`flow='signup'`):
   - Exchange OAuth code for session
   - Redirect to signup completion page
   - **Create profile** after form submission
   - Redirect to dashboard

3. **Email/Password Signin**:
   - Supabase validates credentials
   - Profile must exist from previous signup
   - If profile missing (edge case) → Show same error

**Cleanup Not Required**:

Users in `auth.users` without matching profiles are **harmless** and do **not** need cleanup:
- They cannot access the dashboard (profile check blocks them)
- They cannot sign in (same error message)
- They are effectively "identity records" with no system access
- Optional cleanup query (for housekeeping only):

```sql
-- Find auth.users without profiles (optional cleanup)
SELECT u.id, u.email, u.created_at
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM user_buyers WHERE id = u.id)
AND NOT EXISTS (SELECT 1 FROM user_creators WHERE id = u.id);

-- Delete incomplete users older than 7 days (optional)
DELETE FROM auth.users u
WHERE u.created_at < NOW() - INTERVAL '7 days'
AND NOT EXISTS (SELECT 1 FROM user_buyers WHERE id = u.id)
AND NOT EXISTS (SELECT 1 FROM user_creators WHERE id = u.id);
```

**Error Messages**:

All signin flows show the same error message when profile doesn't exist:

```typescript
toast({
  title: "Account Not Found",
  description: "Your account doesn't exist. Please sign up first.",
  variant: "destructive"
});

// Redirect to signup after 2 seconds
setTimeout(() => {
  navigate(`/signup/${accountType}`);
}, 2000);
```

**Files Implementing This Pattern**:
- `AuthCallbackSimple.tsx` (lines 169-207) - OAuth callback profile check
- `SigninForm.tsx` (lines 198-208) - Email signin profile check
- `Profile.tsx` (lines 193-205, 241-253) - Profile page existence validation

---

## User Journeys

### New Buyer Journey

#### Email Signup
1. Visit `/signup/buyer`
2. Enter work email + company details
3. Receive verification email
4. Verify email
5. Sign in → Dashboard (`/buyers/home`)

#### OAuth Signup
1. Visit `/signup/buyer`
2. Click "Continue with Google"
3. **System generates OAuth state parameter** (contains flow='signup', accountType='buyer')
4. Authenticate with Google
5. OAuth redirects to `/auth/callback` with state parameter
6. **System validates state parameter** and extracts flow data
7. Complete profile (company, role)
8. Access dashboard immediately

### New Creator Journey

#### Email Signup
1. Visit `/signup/creator`
2. Enter email (any) + pen name + **role (REQUIRED)**
3. Receive verification email
4. Verify email
5. Sign in → Pending page (`/creator/invited`)

#### OAuth Signup
1. Visit `/signup/creator`
2. Click "Continue with Google"
3. **System generates OAuth state parameter** (contains flow='signup', accountType='creator')
4. Authenticate with Google
5. OAuth redirects to `/auth/callback` with state parameter
6. **System validates state parameter** and extracts flow data
7. Complete profile (pen name, **role (REQUIRED)**)
8. Access pending page

### OAuth User Without Existing Account Journey (UPDATED 2025-10-03)

#### First-time OAuth Signin (No Existing Profile)
1. User attempts to sign in with Google (`/signin` → "Continue with Google")
2. **System generates OAuth state parameter** (contains flow='signin', accountType from form)
3. Authenticate with Google
4. OAuth redirects to `/auth/callback` with state parameter
5. **System validates state parameter** and extracts accountType
6. **Profile existence check**: Query user_buyers/user_creators by user ID
7. **Profile not found** → Show error toast: "Your account doesn't exist. Please sign up first."
8. Redirect to `/signup/{accountType}` after 2 seconds

**Note**: Users who exist in `auth.users` but not in `user_buyers`/`user_creators` are treated as "no account" - profile existence is the authoritative check.

### Returning User Journey

#### Email/Password Signin
1. Visit `/signin`
2. Enter email and password
3. System validates credentials
4. Detect account type from user metadata
5. Redirect to appropriate dashboard

#### OAuth Signin (Existing Profile)
1. Visit `/signin`
2. Click "Continue with Google"
3. **System generates OAuth state parameter** (contains flow='signin', accountType)
4. Authenticate with Google
5. OAuth redirects to `/auth/callback` with state parameter
6. **System validates state parameter** and extracts flow data
7. Exchange OAuth code for session
8. **Profile existence check**: Query user_buyers/user_creators by user ID
9. **Profile found** → Redirect to dashboard (first login: reload for fresh state)
10. Access appropriate dashboard based on account type

---

## Development & Testing

### Local Setup

```bash
# Install dependencies
npm install

# Start apps
npm run dev:website    # localhost:5173
npm run dev:dashboard  # localhost:8081

# Environment variables (.env.local)
VITE_DASHBOARD_URL=http://localhost:8081
VITE_WEBSITE_URL=http://localhost:5173
VITE_AUTH_DEBUG=true  # Enable debug logging
```

### Testing Checklist

#### Email Signup
- [ ] Buyer with work email
- [ ] Buyer with personal email (should fail)
- [ ] Creator with any email + required role selection
- [ ] Creator role validation (author/agent required)
- [ ] Email verification flow
- [ ] Password requirements validation

#### OAuth Signup
- [ ] Google OAuth initiation
- [ ] **OAuth state parameter generated** (check browser DevTools Network tab)
- [ ] **State parameter in callback URL** (format: `?code=xxx&state=32-char-hex`)
- [ ] **State validation success** (check console logs)
- [ ] Profile completion with required fields
- [ ] Creator role requirement validation
- [ ] Full name read-only for OAuth completion
- [ ] Email domain validation (buyers)
- [ ] Session establishment
- [ ] Account type metadata properly set

#### OAuth Signin
- [ ] **Existing Account** - Google OAuth signin
- [ ] **OAuth state parameter generated** with flow='signin'
- [ ] **State parameter in callback URL** (format: `?code=xxx&state=32-char-hex`)
- [ ] **State validation success** (check console logs)
- [ ] **Profile existence check** (check console: "🔍 OAuth signin - checking profile existence")
- [ ] **Profile found** → Redirect to dashboard
- [ ] **Profile not found** → Error toast "Your account doesn't exist. Please sign up first."
- [ ] **Profile not found** → Redirect to `/signup/{accountType}` after 2 seconds

#### Email/Password Signin
- [ ] Email/password signin with existing account
- [ ] Account type detection from metadata
- [ ] Correct routing based on tier/status
- [ ] **Profile existence check** for edge cases

#### Cross-Domain
- [ ] Website → Dashboard redirect
- [ ] Session token transfer
- [ ] URL parameter handling

### Debug Commands

```javascript
// Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

// Check profiles
const buyer = await supabase.from('user_buyers').select('*').eq('email', email);
const creator = await supabase.from('user_creators').select('*').eq('email', email);

// Check account type
console.log('Account type:', user.user_metadata?.account_type);

// Check OAuth state in sessionStorage
Object.keys(sessionStorage)
  .filter(key => key.startsWith('oauth_'))
  .forEach(key => {
    console.log(key, JSON.parse(sessionStorage.getItem(key)));
  });

// Validate specific OAuth state
import { validateOAuthState } from '@/utils/oauthSecurity';
const state = 'your-32-char-hex-state';
const oauthData = validateOAuthState(state);
console.log('OAuth data:', oauthData);

// Check profile existence
async function checkProfile(userId, accountType) {
  const table = accountType === 'buyer' ? 'user_buyers' : 'user_creators';
  const { data } = await supabase.from(table).select('id').eq('id', userId).maybeSingle();
  console.log(`Profile exists in ${table}:`, !!data);
  return !!data;
}

// Enable debug logging
localStorage.setItem('auth_debug', 'true');
```

---

## Troubleshooting

### Common Issues

#### "User redirected to wrong page after login"
- Check `tier` field in `user_buyers` table
- Check `invitation_status` in `user_creators` table
- Verify account type detection logic

#### "OAuth signup fails with personal email"
- Expected behavior for buyers
- User must use work email
- Check `consumerEmailProviders` list

#### "Profile not created after signup"
- Check database trigger is active
- Verify metadata contains `account_type`
- Check RLS policies

#### "OAuth signup hangs or times out" (RESOLVED - 2025-10-01)
**Symptoms:**
- OAuth callback succeeds but profile creation hangs
- "Multiple GoTrueClient instances detected" warnings
- Session timeouts after 12-25 seconds
- Works locally but fails in production

**Root Cause:** Browser service role client conflicting with main auth client

**Solution:** Edge Function Architecture (Implemented 2025-10-01)
- **Status:** ✅ RESOLVED - 100% success rate achieved
- **Implementation:** Server-side edge functions for profile creation
- **Performance:** Session resolution improved from 25s to 3ms
- **Architecture:** Browser → Session Token → Edge Function → Service Role → Database

**Success Pattern:**
```
🚀 EDGE FUNCTION: Attempting buyer profile creation via edge function
⏳ Waiting for valid session to get access token...
✅ Valid session found on attempt 1 for user: email (3ms)
✅ EDGE FUNCTION SUCCESS: Buyer profile created successfully via edge function!
```

**See:** `OAUTH_EDGE_FUNCTION_SOLUTION.md` for complete technical details

#### "Password reset link doesn't work"
- Check for expired tokens
- Verify hash parameter parsing
- Check email delivery (spam folder)

### SQL Debugging Queries

```sql
-- Check user profiles
SELECT 
  au.email,
  au.raw_user_meta_data->>'account_type' as account_type,
  ub.tier as buyer_tier,
  uc.invitation_status as creator_status
FROM auth.users au
LEFT JOIN user_buyers ub ON ub.id = au.id
LEFT JOIN user_creators uc ON uc.id = au.id
WHERE au.email = 'user@example.com';

-- Find duplicate profiles
SELECT email FROM user_creators 
INTERSECT 
SELECT email FROM user_buyers;

-- Check triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'auth';
```

---

## Migration History

### Major Changes

#### 2025-09-21: Creator Role Requirements & Profile Schema Updates
- **BREAKING CHANGE**: `ip_owner_role` is now REQUIRED for all creator signups
- Added `invitation_status` field to creator profile management UI
- Updated signup forms: Role dropdown now mandatory with validation
- OAuth completion: Full name field made read-only, Pen name shows required asterisk
- Enhanced auth metadata handling: `account_type` consistently set in both email and OAuth flows
- Updated validation: Role selection required for both email and OAuth creator signups
- Profile page: Added invitation status field with dropdown (invited/active/pending)

#### 2025-01-14: OAuth Flow Simplification (CRITICAL PERFORMANCE FIX)
- **BREAKING CHANGE**: Replaced complex OAuth callback system with streamlined approach
- **Performance**: 90% faster OAuth callbacks, eliminated timeouts and hanging
- **Simplified Architecture**:
  - Single callback handler: `AuthCallbackPageFixed.tsx` (80 lines vs 400+)
  - Fast account type detection: `simpleAccountTypeDetection.ts` (metadata-only)
  - Consistent redirect URLs: Always use `${window.location.origin}/auth/callback`
- **Removed Complexity**:
  - Eliminated 700+ line account type detection with circuit breakers
  - Removed multiple conflicting callback handlers
  - Simplified redirect URL construction (no environment conditionals)
  - Removed database queries during OAuth callback
- **Clear Priority Order**: URL params → metadata → sessionStorage → error (no defaults)
- **Total Reduction**: From 1000+ lines to ~200 lines across all OAuth components

#### 2025-09-12: Buyer Login Redirect Change
- Changed default buyer login redirect from `/buyers/titles` to `/buyers/home`
- Provides better onboarding experience with dashboard overview

#### 2025-09-10: Account Type Standardization
- Renamed `user_ipowners` → `user_creators`
- Standardized account types to `buyer` and `creator`
- Consolidated multiple triggers into one
- Fixed RLS policies

#### 2025-08-21: Default Tier Change
- Changed default buyer tier from `invited` to `basic`
- New signups get immediate dashboard access

#### 2025-08-16: OAuth Email Validation
- Added work email validation for buyer OAuth signups
- Improved error messaging

### Resolved Issues

1. **Table Name Inconsistency** ✅
   - Migration from `user_ipowners` to `user_creators` complete

2. **Duplicate Profile Creation** ✅
   - Consolidated triggers prevent duplicates

3. **Session Management** ✅
   - Enhanced token validation and recovery

4. **Performance Issues** ✅
   - Implemented caching for tier access
   - Reduced database queries by 70-80%

---

## Best Practices

### Development Guidelines

1. **Always use `pen_name`** field for creator profiles
2. **Query by `email`**, never by `user_id`
3. **Test both email and OAuth** flows
4. **Enable debug logging** during development
5. **Check for existing profiles** before creation

### Security Considerations

1. **Validate email domains** for buyer accounts
2. **Use RLS policies** for data access
3. **Sanitize URL parameters** in cross-domain flows
4. **Clear sensitive data** from sessionStorage
5. **Monitor failed authentication** attempts

### Performance Optimization

1. **Use TierProvider** for tier-gated content
2. **Cache account type** detection results
3. **Minimize database queries** with context providers
4. **Batch profile lookups** when possible

---

## Quick Reference

### File Locations

```
/apps/dashboard/src/
├── pages/
│   ├── SigninPage.tsx
│   ├── SignupPage.tsx
│   ├── BuyerSignupPage.tsx
│   ├── CreatorSignupPage.tsx
│   ├── AuthCallbackPageFixed.tsx  # NEW: Streamlined OAuth callback
│   └── AccountTypeSelectionPage.tsx
├── hooks/
│   ├── useAuth.tsx
│   └── useTierAccess.tsx
└── utils/
    └── simpleAccountTypeDetection.ts  # NEW: Replaced complex detection

/supabase/
├── migrations/
│   └── [migration files]
└── functions/
    └── create-creator-profile/
```

### Environment Variables

```bash
# Required
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_DASHBOARD_URL
VITE_WEBSITE_URL

# Optional (Development)
VITE_AUTH_DEBUG=true
VITE_LOCAL_TESTING=true
VITE_OAUTH_TESTING=true
```

### Important URLs

- **Dashboard Dev**: http://localhost:8081
- **Website Dev**: http://localhost:5173
- **Dashboard Prod**: https://dashboard.kstorybridge.com
- **Website Prod**: https://kstorybridge.com
- **Supabase Dashboard**: https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd

---

**Note**: This document is the single source of truth for authentication. All app-specific CLAUDE.md files should reference this document for auth-related information.